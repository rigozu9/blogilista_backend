const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs");

const helper = require('./test_helper.js')
const api = supertest(app)


const Blog = require('../models/blog.js')
const User = require('../models/user')

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
  let token = null
  beforeEach(async () => {
    await User.deleteMany({})

    const hash = await bcrypt.hash('secret', 10)
    const user = new User({
      username: 'test man',
      name: 'make',
      passwordHash: hash,
    })

    await user.save()

    const userForToken = {
      username: user.username,
      id: user.id,
    }

    token = jwt.sign(userForToken, process.env.SECRET)
  })
  test('blog can be posted', async () => {
    const testblog = {
      url: 'www.123.com',
      title: 'Moro mitä äijä',
      author: 'Moro make',
      likes: '69'
    }
    await api
      .post('/api/blogs')
      .set("Authorization", `Bearer ${token}`)
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
      .set("Authorization", `Bearer ${token}`)
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
      .set("Authorization", `Bearer ${token}`)
      .send(testblog)
      .expect(400)

    const blogsInTheEnd = await helper.blogsInDb()
    expect(blogsInTheEnd).toHaveLength(helper.initialBlogs.length)
  })  
})

describe('HTTP DELETE', () => {
  let token = null
  beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({})

    const hash = await bcrypt.hash('secret', 10)
    const user = new User({
      username: 'trest man',
      name: 'tester make',
      passwordHash: hash,
    })

    await user.save()

    const userForToken = {
      username: user.username,
      id: user.id,
    }

    token = jwt.sign(userForToken, process.env.SECRET)

    const testBlog = {
      title: 'testing blog',
      author: 'MAKE MAKE',
      url: 'www.makez.com',
      likes: 69
    }

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(testBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)
  })
  test('a blog can be deleted', async () => {
    const blogsAtStart = await Blog.find({})
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204)
  
    const blogsAtEnd = await helper.blogsInDb()
  
    expect(blogsAtEnd).toHaveLength(
      blogsAtStart.length - 1
    )
    const titles = blogsAtEnd.map(r => r.title)
    expect(titles).not.toContain(blogToDelete.title)
  })
})

describe('when there is initially one user at db', () => {
  let token = null
  beforeEach(async () => {
    await User.deleteMany({})

    const hash = await bcrypt.hash('secret', 10)
    const user = new User({
      username: 'test man',
      name: 'make',
      passwordHash: hash,
    })

    await user.save()

    const userForToken = {
      username: user.username,
      id: user.id,
    }

    token = jwt.sign(userForToken, process.env.SECRET)
  })
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'Make 52',
      name: 'Makeee123',
      password: '1234',
    }

    await api
      .post('/api/users')
      .set("Authorization", `Bearer ${token}`)
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })
  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'test man',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails if username is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      name: 'name',
      password: 'password',
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error)
      .toContain('User validation failed: username: Path `username` is required.')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails if password is missing', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'moimoi',
      name: 'name',
    }

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(response.body.error).toContain("password is required")

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails if name length < 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'ee',
      name: 'Under 3',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain("User validation failed: username: Path `username` (`ee`) is shorter than the minimum allowed length (3).")

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
  test('creation fails if password length < 3', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'moromitäukko',
      name: 'Under 3',
      password: '12',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain("password must be at least 3 characters long")

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})


afterAll(async () => {
  await mongoose.connection.close()
})

//npm test -- -t 'HTTP GET'
//npm test -- -t 'id checker'
//npm test -- -t 'HTTP POST'
//npm test -- -t 'empty title/url property'
//npm test -- -t 'HTTP DELETE'
//npm test -- -t 'creation fails if name length < 3'