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
  const fetchAndEmitStories = async (socket) => {
    try {
        const storyIDs = (await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json')).data;
        const stories = await Promise.all(storyIDs.slice(0, 10).map(id => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)));
       //console.log('***Emitting stories:***', stories.map(story => story.data)); 
        socket.emit('stories', stories.map(story => story.data));
    } catch (error) {
        console.error(`Failed to fetch stories: ${error}`);
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
      const pollIDs = (await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json')).data;
      const pollPromises = pollIDs.slice(0, 10).map(id => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`));
      const pollResponses = await Promise.all(pollPromises);
      const polls = pollResponses.map(response => response.data)
        .filter(item => item.type === 'poll'); // Filter for polls only
    
      socket.emit('polls', polls); // Emit the polls to the client
    
      console.log('***Emitting polls:', polls);
    } catch (error) {
      console.error(`Failed to fetch polls: ${error}`);
    }
  };
  
  


  io.on('connection', (socket) => {
    console.log('A user connected');
    fetchAndEmitStories(socket);
    fetchAndEmitJobs(socket);
    fetchAndEmitPolls(socket);
  
    // event listener for stories
    socket.on('getStories', () => {
        fetchAndEmitStories(socket);
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

