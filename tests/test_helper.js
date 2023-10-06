const Blog = require('../models/blog.js') 
const User = require('../models/user')

initialBlogs = [
    {
      "title": "Chelsea Blog",
      "author": "Rigozu 9",
      "url": "www.ktbffh.com",
      "likes": 9999999969
    },
    {
      "title": "Äpåsky Blog",
      "author": "Make 9",
      "url": "www.cheslearh.com",
      "likes": 420
    },
  ]
  
  const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
  }

  const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
  }
  
  module.exports = {
    initialBlogs,
    blogsInDb,
    usersInDb,
}
  