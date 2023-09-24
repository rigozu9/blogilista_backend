const dummy = (blogs) => {
    return 1
  }
  
  const totalLikes = (blogs) => {
    const summa = blogs.reduce((sum, blog) => {
        return sum + blog.likes}, 0)
    return summa
  }

const favoriteBlog = (blogs) => {
    const mostLiked = blogs.reduce((maxBlog, currentBlog) => {
        return currentBlog.likes > maxBlog.likes ? currentBlog : maxBlog;}, blogs[0])
    console.log(mostLiked)
    return mostLiked
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}