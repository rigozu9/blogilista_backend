const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper.js')
const api = supertest(app)

const Blog = require('../models/blog.js')

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('HTTP GET', () => {
  test('blogs are returned as json', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

  test('same amount of blogs returned', async () => {
    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })


  test('id checker', async () => {
    const response = await api.get('/api/blogs')
    const ids = response.body.map(blog => blog.id)
    for (id of ids) {
      expect(id).toBeDefined()
    }
  })
})

describe('HTTP POST', () => {
  test('blog can be posted', async () => {
    const testblog = {
      title: 'Moro mitä äijä',
      author: 'Moro make',
      url: 'www.123.com',
      likes: '69'
    }
    await api
      .post('/api/blogs')
      .send(testblog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    
    const blogsInTheEnd = await helper.blogsInDb()
    expect(blogsInTheEnd).toHaveLength((helper.initialBlogs.length)+1)

    const blogTitles = blogsInTheEnd.map(blog => blog.title)
    expect(blogTitles).toContain('Moro mitä äijä')    
    
  })
  test('empty like property', async () => {
    const testblog = {
      title: 'Moro mitä äijä',
      author: 'Moro make',
      url: 'www.123.com',
    }
    await api
      .post('/api/blogs')
      .send(testblog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  
    const blogsInTheEnd = await helper.blogsInDb()
    expect(blogsInTheEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(blogsInTheEnd[blogsInTheEnd.length - 1].likes).toBe(0)
    console.log(blogsInTheEnd)
  })
  test('empty title/url property', async () => {
    const testblog = {
      author: 'Moro make',
      likes: 6969696
    }

    await api
      .post('/api/blogs')
      .send(testblog)
      .expect(400)

    const blogsInTheEnd = await helper.blogsInDb()
    expect(blogsInTheEnd).toHaveLength(helper.initialBlogs.length)
  })  
})

afterAll(async () => {
  await mongoose.connection.close()
})

//npm test -- -t 'HTTP GET'
//npm test -- -t 'id checker'
//npm test -- -t 'HTTP POST'
//npm test -- -t 'empty title/url property'