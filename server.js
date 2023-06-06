//initalizing express
const express = require('express');
const app = express();
 
//app represents the Express application,
// and you'll use it to define routes, handle requests
const http = require('http');
const server = http.createServer(app);

//accessing the server
const socketIO = require('socket.io');
//const io = socketIO(server);
const io = new socketIO.Server(server);

const path = require('path');

const PAGE_SIZE = 10;

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'static', 'index.html');
  res.sendFile(filePath);
});

// Serve static files from the 'static' directory
app.use(express.static(path.join(__dirname, 'static')));


app.get('/client.js', (req, res) => {
  const filePath = path.join(__dirname, 'static', 'client.js');
  res.set('Content-Type', 'text/javascript'); // Specify the MIME type
  res.sendFile(filePath);
});


  const axios = require('axios');

 
  
// Fetches and emits story data
const fetchAndEmitStories = async (socket,page = 1) => {
  try {
    const storyIDs = (await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json')).data;
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const stories = await Promise.all(storyIDs.slice(start, end).map(id => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)));

    const orderedStories = stories.map(story => story.data).sort((a, b) => b.time - a.time);
    socket.emit('stories', orderedStories);
  } catch (error) {
    console.error(`Failed to fetch stories: ${error}`);
  }
};

  

  const fetchAndEmitComments = async (socket, parentId) => {
    try {
      const response = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${parentId}.json`);
      const commentIds = response.data.kids || [];
      if (commentIds.length > 0) {
        const commentPromises = commentIds.map(id => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`));
        const comments = await Promise.all(commentPromises);
  
        const orderedComments = comments.map(response => response.data).sort((a, b) => b.time - a.time);
        socket.emit('comments', orderedComments)
      } else {
        console.log(`No comments for item with id ${parentId}`);
        socket.emit('comments', []); // Emit an empty array if there are no comments
      }
    } catch (error) {
      console.error(`Failed to fetch comments: ${error}`);
    }
  };


const fetchAndEmitJobs = async (socket) => {
    try {
      const jobIDs = (await axios.get('https://hacker-news.firebaseio.com/v0/jobstories.json')).data;
      const jobPromises = jobIDs.slice(0, 10).map(id => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`));
      const jobResponses = await Promise.all(jobPromises);
      const jobs = jobResponses.map(response => response.data);
  
      //console.log('***Emitting jobs:', jobs);
      socket.emit('jobs', jobs);
    } catch (error) {
      console.error(`Failed to fetch jobs: ${error}`);
    }
  };
  
const fetchAndEmitPolls = async (socket) => {
  try {
    const pollIDs = [
      31891675, 31869104, 31788898, 31780911, 31716715, 31598236, 31587976
    ];
    const polls = await Promise.all(pollIDs.map(id => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)));
    socket.emit('polls', polls.map(poll => poll.data));
  } catch (error) {
    console.error(`Failed to fetch polls: ${error}`);
  }
};
  
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; media-src 'self' data:;"
  );
  next();
});

  io.on('connection', (socket) => {
    console.log('A user connected');
    fetchAndEmitStories(socket);
    fetchAndEmitJobs(socket);
    fetchAndEmitPolls(socket);
   fetchAndEmitComments(socket);
  
    // event listener for stories
    socket.on('getStories', () => {
        fetchAndEmitStories(socket);
    });

    //event listener for stories
    socket.on('getComments', (parentId) => {
      fetchAndEmitComments(socket, parentId);
    });

    //event listner for jobs
    socket.on('getJobs' , () => {
        fetchAndEmitJobs(socket);
    });

    socket.on('polls', (polls, ack) => {
        console.log('Received polls:', polls);
        fetchAndEmitPolls(socket);
      });


    socket.on('disconnect', () => {
      console.log('User disconnected');
    });

  });

server.listen(3000, () => {
  console.log('listening on *:3000');
});

