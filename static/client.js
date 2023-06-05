document.addEventListener('DOMContentLoaded', function () {
    const socket = io('http://localhost:3000');
  
    socket.on('connect_error', (error) => {
      console.log(error);
    });
  
    socket.on('connect', () => {
      console.log('Connected to the server.');
  
      socket.on('stories', (stories) => {
        console.log('Received stories:', stories);
        renderPosts(stories);
      });


      socket.on('jobs',(jobs) => {
        console.log('Recieved jobs', jobs);
        renderJobs(jobs);
      })


      socket.on('polls', (polls) => {
        console.log('Received polls:', polls);
        renderPolls(polls);
      });

    });
  
    function renderPosts(stories) {
      const storyList = document.querySelector('#story-list');
      storyList.innerHTML = '';
  
      for (let story of stories) {
        const storyElement = document.createElement('div');
        storyElement.textContent = story.title;
        storyElement.className = 'story-card';

      // Make the story card clickable
      storyElement.addEventListener('click', () => {
        window.location.href = story.url; // Redirect to the story's URL -> change so that a new web page is opened
      });

        storyList.appendChild(storyElement);
      }
    }


    function renderJobs(jobs) {
        const jobList = document.querySelector('#job-list');
        jobList.innerHTML = '';
    
        for (let job of jobs) {
          const jobElement = document.createElement('div');
          jobElement.textContent = job.title;
          jobElement.className = 'job-card';

        //make job cards clickable -> change so that a new web page is opened
        jobElement.addEventListener('click', () => {
            window.location.href = job.url; // Redirect to the story's URL
         });
          jobList.appendChild(jobElement);
        }
      }

      function renderPolls(polls) {
        const pollList = document.querySelector('#poll-list');
        pollList.innerHTML = '';
      
        for (let poll of polls) {
          const pollElement = document.createElement('div');
          pollElement.textContent = poll.title;
          pollElement.className = 'poll-card';
      
          // Make the poll card clickable
          pollElement.addEventListener('click', () => {
            window.location.href = poll.url; // Redirect to the poll's URL
          });
      
          pollList.appendChild(pollElement);
        }
      }
  });
  
 