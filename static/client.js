document.addEventListener('DOMContentLoaded', function () {
  const socket = io('http://localhost:3000');
  let currentPage = 1; // Define currentPage as a global variable
  socket.on('connect_error', (error) => {
    console.log(error);

  });

  socket.on('connect', () => {
    console.log('Connected to the server.');

    socket.on('stories', (stories) => {
      //console.log('Received stories:', stories);
      renderPosts(stories);
      paginate(stories, 10, currentPage); // 10 stories per page
    });

    socket.on('comments',(comments) => {
      console.log('Recieved comments***:', comments)
      renderComments(comments);
    });

    socket.on('jobs', (jobs) => {
     // console.log('Received jobs:', jobs);
      renderJobs(jobs);
    });

    socket.on('polls', (polls) => {
      console.log('Received polls:', polls);
      renderPolls(polls);
    });

    function renderPosts(stories) {
      const storyList = document.querySelector('#story-list');
      storyList.innerHTML = '';

      for (let story of stories) {
        const storyElement = document.createElement('div');
        storyElement.textContent = story.title;
        storyElement.className = 'story-card';
        socket.emit('getStories', currentPage);
        // Make the story card clickable
        storyElement.addEventListener('click', async () => {
         // window.location.href = story.url; // Redirect to the story's URL
          window.open(story.url, '_blank');
          socket.emit('getComments', story.id);
      //    console.log('recieved story:',story)
        });

       

        storyList.appendChild(storyElement);
      }
    }

// Step 1: Fetch the current maximum item ID
async function fetchMaxItemId() {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/maxitem.json?print=pretty');
    if (response.ok) {
      const maxItemId = await response.json();
      console.log(maxItemId)
      return maxItemId;
    } else {
      throw new Error('Failed to fetch the maximum item ID');
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Step 2: Calculate the minimum item ID
function calculateMinItemId(maxItemId) {
  return maxItemId - 10; // Adjust the range as needed
}

// Step 3: Fetch the range of items within the specified range
async function fetchItemsInRange(minItemId, maxItemId) {
  try {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${minItemId}..${maxItemId}.json`);
    if (response.ok) {
      const items = await response.json();
      console.log(items)
      return items;
    } else {
      throw new Error('Failed to fetch items within the range');
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Step 4: Filter for comments
function filterComments(items) {
  return items.filter(item => item && item.type === 'comment');
}

// Step 5: Fetch and render comments
async function fetchAndRenderComments() {
  const maxItemId = await fetchMaxItemId();
  if (!maxItemId) return;

  const minItemId = calculateMinItemId(maxItemId);
  const items = await fetchItemsInRange(minItemId, maxItemId);
  if (!items) return;

  const comments = filterComments(items);
  renderComments(comments);
}

// Step 6: Render comments on the UI
function renderComments(comments) {
  // Render the comments on the UI as needed
  console.log(comments);
}
// Step 6: Render comments on the UI
function renderComments(comments) {
  const commentList = document.querySelector('#comment-list');
  commentList.innerHTML = ''; // Clear previous comments

  for (const comment of comments) {
    const commentElement = createCommentElement(comment);
    commentList.appendChild(commentElement);
  }

  
}

    function createCommentElement(comment) {
      const commentElement = document.createElement('div');
      commentElement.textContent = comment.text;
      commentElement.className = 'comment-card';
      return commentElement;
    }



    function renderJobs(jobs) {
      const jobList = document.querySelector('#job-list');
      jobList.innerHTML = '';

      for (let job of jobs) {
        const jobElement = document.createElement('div');
        jobElement.textContent = job.title;
        jobElement.className = 'job-card';

        // Make the job card clickable
        jobElement.addEventListener('click', () => {
          window.open(job.url, '_blank');
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
          // Handle the click event and perform the desired action
          openPoll(poll);
        });

        pollList.appendChild(pollElement);
      }
    }

    function openPoll(poll) {
      // Check if the poll has a URL
      if (poll.url) {
        window.open(poll.url, '_blank'); // Open the poll's URL in a new tab
      } else {
        // If the poll doesn't have a URL, fetch the poll data to retrieve the URL
        fetch(`https://hacker-news.firebaseio.com/v0/item/${poll.id}.json?print=pretty`)
          .then(response => response.json())
          .then(pollData => {
            if (pollData.url) {
              window.open(pollData.url, '_blank'); // Open the retrieved URL in a new tab
            } else {
              console.log(`Poll with ID ${poll.id} doesn't have a URL`);
            }
          })
          .catch(error => {
            console.error(`Failed to fetch poll data: ${error}`);
          });
      }
    }
    


    function paginate(data, limit, currentPage = 1) {
      const pagination = document.querySelector("#pagination");
      pagination.textContent = "";
      
      const pageCount = Math.ceil(data.length / limit);
      const start = (currentPage - 1) * limit;
      const end = start + limit;
      const pageData = data.slice(start, end);
    
      // Add the 'Previous' button
      const prevButton = document.createElement("button");
      prevButton.textContent = "Previous";
      prevButton.onclick = () => {
        if(currentPage > 1) {
          currentPage--;
          socket.emit('getStories', currentPage); // Emit the getStories event with the new page number
          paginate(data, limit, currentPage);
        }
      };
      pagination.append(prevButton);
      
      // Numbered buttons for each page
      for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.onclick = () => {
          currentPage = i;
          socket.emit('getStories', currentPage); // Emit the getStories event with the new page number
          paginate(data, limit, i);
        };
        pagination.append(button);
      }
      
      // Add the 'Next' button
      const nextButton = document.createElement("button");
      nextButton.textContent = "Next";
      nextButton.onclick = () => {
        if(currentPage < pageCount) {
          currentPage++;
          socket.emit('getStories', currentPage); // Emit the getStories event with the new page number
          paginate(data, limit, currentPage);
        }
      };
      pagination.append(nextButton);
      
      renderPosts(pageData); // render the posts for this page
    }
    


  });
});
