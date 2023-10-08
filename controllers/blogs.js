const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()

const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })

    response.json(blogs)
  })

blogsRouter.post('/', async (request, response) => {
    const body = request.body
    const token = request.token
    const user = request.user

    const decodedToken = jwt.verify(token, process.env.SECRET)
    
    if (!(token && decodedToken.id)) {
      return response.status(401).json({ error: 'token missing or invalid' }) 
    }

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes,
      user: user._id
    })
    
    const savedBlog = await blog.save()
    //console.log(`Testing: ${savedBlog._id} `)
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response
      .status(201)
      .json(  
        await savedBlog.populate("user", { username: "1", name: "1" })
      )
  })

blogsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id
  const token = request.token
  const user = request.user

  const decodedToken = jwt.verify(token, process.env.SECRET)

  if (!(token && decodedToken.id)) {
    return response.status(401).json({ error: 'token missing or invalid' }) 
  }

  const blog = await Blog.findById(id)

  if (blog.user.toString() === user.id.toString()) {
    await Blog.findByIdAndRemove(id)
    response.status(204).end()
  } else {
    return response.status(401).json({ error: 'only the one who added the blog can delete it' })  
  }
})


module.exports = blogsRouter