const { buildSchema } = require('graphql');

module.exports = buildSchema(`

    type Post{
        _id:ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt:String!
        updatedAt: String!
    }

    input PostInputData{
        title:String!,
        content: String!,
        imageUrl:String!
    }

    type User {
        _id :ID!
        name:String!
        email:String!
        password:String
        status:String!
        posts:[Post!]
    }

    input UserInputData {
        email:String!
        name:String!
        password:String!
    }

    type AuthData{
        token:String!
        userId:String!
    }

    type PostData{
        posts:[Post!]!
        totalPosts:Int!
    }

    input userStatus{
        status:String!
    }

    type Query{
        login (email:String!, password:String!):AuthData!
        posts(page:Int):PostData!
        post(id:String!):Post!
        user:User!
    }


    type Mutation{
        createUser(userInput:UserInputData):User!
        createPost(postInput :PostInputData ):Post!
        updatePost(id: ID!, postInput:PostInputData):Post!
        deletePost(id: ID!):Boolean,
        updateStatus(inputStatus:userStatus):Boolean
       
    }
   
`);
