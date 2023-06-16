const User = require('../models/user');
const Post = require('../models/post');
const bcrypt = require('bcryptjs');
const e = require('express');
const fs = require('fs');
const path = require('path');
const validator = require('validator');

const jwt = require('jsonwebtoken');
module.exports = {
  createUser: async function ({ userInput }, req) {
    //----------------------------------------
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({
        message: 'Email is invalid.',
      });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Passowrd Too short' });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid Input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    //--------------------------------------
    const existingUser = await User.findOne({ email: userInput.email });

    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }

    const hashedp = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedp,
    });

    const createdUser = await user.save();

    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },

  //------------------------------------------------

  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new Error('Kindly signup ! No account for this user.');
      error.code = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error('Password is incorrect');
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      'someSecret',
      {
        expiresIn: '1h',
      },
    );

    return {
      token: token,
      userId: user._id.toString(),
    };
  },

  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error('Invalid user');
      error.code = 401;
      throw error;
    }

    //-------------------------
    const errors = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({
        message: 'Title is invalid',
      });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({
        message: 'Content is invalid',
      });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid Input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    //--------------------------

    let post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });

    user.posts.push(post);
    await user.save();

    const createdPost = await post.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },

  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    if (!page) {
      page = 1;
    }

    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('creator')
      .skip((page - 1) * perPage)
      .limit(perPage);

    return {
      posts: posts.map((post) => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },

  //-----------------------------------------------------

  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    if (!id) {
      const error = new Error('Invalid PostId');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');

    if (!post) {
      const error = new Error('No Post found for this ID.');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  //-------------------------------------------

  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');
    if (!post) {
      const error = new Error('No Post found for this ID.');
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('Not authorized');
      error.code = 403;
      throw error;
    }

    // ---------------------Validation -------------------
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({
        message: 'Title is invalid',
      });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({
        message: 'Content is invalid',
      });
    }

    if (errors.length > 0) {
      const error = new Error('Invalid Input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    //---------------------------------------------------

    post.title = postInput.title;
    post.content = postInput.content;
    if (post.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();
    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },

  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate('creator');

    if (!post) {
      const error = new Error('Could not find post.');
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error('Not Authorized to do this Operation !');
      error.statusCode = 422;
      throw error;
    }

    // user authorized and post exists

    clearImage(post.imageUrl);
    //also clear the relation of Post and user
    await Post.findByIdAndRemove(id);

    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();

    return true;
  },

  //---------------------------------------------------
  user: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    return { ...user._doc };
  },

  updateStatus: async function ({ inputStatus }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);
    user.status = inputStatus.status;

    await user.save();

    return true;
  },
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
