const setBox = document.getElementById("set-box");
const flashcardsContainer = document.getElementById("flashcards");
const setContainer = document.getElementById("set-container");
const cardBox = document.getElementById("card-box");
const modeButtons = document.querySelector('.mode-buttons');
const progressBarContainer = document.getElementById("progress-bar-container");
const progressBar = document.getElementById("progress-bar");
let sets = localStorage.getItem('sets') ? JSON.parse(localStorage.getItem('sets')) : {};
let currentQuizIndex = 0; // Index for quiz mode
let correctAnswers = 0; // To track correct answers
let addonnumber = 0; // To track correct answers
let activeTimer = null;

// Function to get the current date (resetting hours, mins, seconds to zero for streak comparison)
function getCurrentDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to 00:00:00 for date comparison
    return today.getTime();
}
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Function to start the daily quiz and handle the streak logic
function startDailyQuiz() {
    const lastAccess = localStorage.getItem('dailyLastAccess'); // Stored as "YYYY-MM-DD"
    const currentDate = getCurrentDate();

    // Check if the daily quiz was accessed today
    if (!lastAccess || currentDate !== lastAccess) {
        // User hasn't taken the quiz today, so allow access
        updatedailySet(); // Select the random 10 questions
        toggleFlashcards("Daily"); // Show the daily deck
        
        // Update the last access date to today
        
    } else {
        alert("Daily quiz is only available once every 24 hours.");
    }
}

function updatedailySet() {
    const allFlashcards = [];
    
    // Loop through each set in `sets` and collect all flashcards
    for (let setName in sets) {
        if (setName !== 'Mistakes' && setName !== 'Consolidate'&& setName !== 'Daily'){
            // Ensure we only collect flashcards from decks that have them
        if (sets[setName].flashcards && Array.isArray(sets[setName].flashcards)) {
            allFlashcards.push(...sets[setName].flashcards);
        }

        }
        
    }

    // Shuffle all collected flashcards and select 10 random ones (or fewer if less than 10 available)
    const shuffledFlashcards = allFlashcards.sort(() => 0.5 - Math.random());
    const dailyDeck = shuffledFlashcards.slice(0, 10);

    // Store the dailyDeck in `sets["Daily"]` and update local storage
    sets["Daily"] = dailyDeck;
    localStorage.setItem('sets', JSON.stringify(sets));
}



// Helper function to display the current streak (optional)
function displayStreak() {
    const streak = parseInt(localStorage.getItem('dailyStreak'), 10) || 0;
    console.log(`Current Streak: ${streak} days`); // Or update an HTML element to show streak
}


let performanceData = localStorage.getItem('performanceData')
    ? JSON.parse(localStorage.getItem('performanceData'))
    : {
          totalQuestionsCreated: 0,
          totalQuestionsAttempted: 0,
          totalActiveTime: 0,
          scoresByTopic: {}, // { topicName: [scores array] }
          attemptsBySet: {}   // { setName: [percentage accuracy history] }
      };

function updateProgressBar() {
    const setName = flashcardsContainer.dataset.currentSet;
    
    if (setName!== 'Consolidate' && setName !=='Mistakes' && setName !=='Daily'){
        totalQuestions = sets[setName].flashcards.length + addonnumber; // Total questions including mistakes
    }
    if (setName== 'Consolidate' || setName =='Mistakes'|| setName =='Daily'){
        totalQuestions = sets[setName].length + addonnumber; // Total questions including mistakes
    }
    const currentProgress = (currentQuizIndex + addonnumber) / totalQuestions * 100; // Calculate progress percentage
    progressBar.style.width = `${currentProgress}%`; // Update the width of the progress bar
}
function saveQuizProgress() {
    localStorage.setItem('performanceData', JSON.stringify(performanceData));
    localStorage.setItem('currentQuizIndex', currentQuizIndex);
    localStorage.setItem('correctAnswers', correctAnswers);
    localStorage.setItem('addonnumber', addonnumber);
    localStorage.setItem('attemptsBySet', JSON.stringify(performanceData.attemptsBySet));
}

// Load sets on initial page load
loadSets();
initializeStarRating();

function createSet() {
    const setName = document.getElementById("set-name").value.trim();
    const setDescription = document.getElementById("set-description").value.trim();
    const setTags1 = document.getElementById("set-tags").value.trim();
    const setTags = document.getElementById("set-tags").value.split(",").map(tag => tag.trim());
    
    const maxSetNameLength = 21;
    const maxDescriptionLength = 45;
    const maxTagLength = 45;

    // Validation checks
    if (!setName || setName.length > maxSetNameLength) {
        alert(`Deck Name must be between 1 and ${maxSetNameLength} characters.`);
        return;
    }
    if (!setName || setTags1.length > maxTagLength) {
        alert(`Deck Name must be between 1 and ${maxTagLength} characters.`);
        return;
    }
    
    if (setDescription.length > maxDescriptionLength) {
        alert(`Description must not exceed ${maxDescriptionLength} characters.`);
        return;
    }
    

    if (setName && !sets[setName]) {
        sets[setName] = {
            description: setDescription,
            tags: setTags,
            flashcards: []
        };

        localStorage.setItem('sets', JSON.stringify(sets));
        loadSets();
        initializeStarRating();
        
        hideSetBox();
        
       
        document.getElementById("set-name").value = '';
        document.getElementById("set-description").value = ''; // Clear description input
        document.getElementById("set-tags").value = ''; // Clear tags input
    }
    console.log(sets[setName].tags)
    
}
function markAsAttempted(setName, questionIndex) {
    if (setName!== 'Consolidate' && setName !=='Mistakes' && setName !=='Daily'){
    
        sets[setName].flashcards[questionIndex].lastAttempted = Date.now();
        localStorage.setItem('sets', JSON.stringify(sets));
    }
    if (setName == 'Consolidate' || setName =='Mistakes'|| setName =='Daily'){
        console.log(sets[setName][questionIndex])
    
        sets[setName][questionIndex].lastAttempted = Date.now();
        localStorage.setItem('sets', JSON.stringify(sets));
    }

}
function updateConsolidateSet() {
    const now = Date.now();
    
    const consolidateQuestions = [];

    Object.keys(sets).forEach(setName => {
        if (setName !== "Mistakes" && setName !== "Performance" && setName !== "Consolidate"&& setName !=='Daily') {
            sets[setName].flashcards.forEach(question => {
                
                consolidateQuestions.push(question);
                
            });
        }
    });

    // Sort by `lastAttempted` in ascending order (oldest first)
    consolidateQuestions.sort((a, b) => a.lastAttempted - b.lastAttempted);

    // Select the 5 or more oldest questions
    const oldestQuestions = consolidateQuestions.slice(0, Math.min(4, consolidateQuestions.length));

    // Update the "Consolidate" set
    sets["Consolidate"] = oldestQuestions;
    localStorage.setItem('sets', JSON.stringify(sets));
}

const searchBar = document.getElementById('searchBar');

function loadSets(filter = "") {
    setContainer.innerHTML = `
    <div class="flashcard add-set" onclick="newSetShown()">
        <div class =" flashcard-content">
            <i class="fas fa-plus set-icon"></i>
            <h2>Create New Deck</h2>
        </div>
    </div>
    `;

    // Check if Mistakes set exists; if not, create it
    if (!sets["Mistakes"]) {
        sets["Mistakes"] = [];
        localStorage.setItem('sets', JSON.stringify(sets));
    }
        // Check if Mistakes set exists; if not, create it
    if (!sets["Consolidate"]) {
            sets["Consolidate"] = [];
            localStorage.setItem('sets', JSON.stringify(sets));
    }
    if (!sets["Daily"]) {
        sets["Daily"] = [];
        localStorage.setItem('sets', JSON.stringify(sets));
    }

    // Create a div for the Mistakes set
    const mistakesDiv = document.createElement("div");
    mistakesDiv.className = 'flashcard mistakes-set'; 
    
    mistakesDiv.dataset.setName = "Mistakes";
    mistakesDiv.innerHTML = `
        <i class="fas fa-question-circle question-icon" id="question-mark-mistakes" style="cursor: pointer; font-size: 24px;position: absolute; top: 10px; left: 10px; color: #C70039;"></i>
        <div class="flashcard-content">
           
            <i class="fas fa-exclamation-triangle set-icon"></i>
            <h2>Mistakes</h2>
            
        </div>
    `;
        // Check if Mistakes set exists; if not, create it


    // Create a div for the Mistakes set
    const consolidateDiv = document.createElement("div");
    consolidateDiv.className = 'flashcard consolidate-set'; 
    consolidateDiv.dataset.setName = "Consolidate";
    consolidateDiv.innerHTML = `
        <i class="fas fa-question-circle question-icon" id="question-mark-consolidate" style="cursor: pointer; font-size: 24px; color: #C70039; position: absolute; top: 10px; left: 10px;"></i>
        <div class="flashcard-content">
            <i class="fa-solid fa-dumbbell set-icon"></i>
            <h2>Consolidate</h2>
            
        </div>
    `;
    const streak = getDailyStreak();
    const dailyDiv = document.createElement("div");
    dailyDiv.className = 'flashcard daily-set'; 
    dailyDiv.dataset.setName = "Daily";
    dailyDiv.innerHTML = `
        <i class="fas fa-question-circle question-icon" id="question-mark-daily"style="cursor: pointer; font-size: 24px; color: #C70039; position: absolute; top: 10px; left: 10px;"></i>
        <div class="flashcard-content">

            <i class="fa fa-calendar set-icon"></i>
            <h2>Daily</h2>
            <p>Streak: ${streak} days</p>
            <p id="countdown"></p> <!-- Countdown placeholder -->
            
        </div>
    `;
    
    const countdownElement = dailyDiv.querySelector("#countdown");
    
    startCountdown(countdownElement);



    // Create a div for the Performance set
    const performanceDiv = document.createElement("div");
    performanceDiv.className = 'flashcard performance-set'; 
    performanceDiv.dataset.setName = "Performance";
    performanceDiv.innerHTML = `
        <i class="fas fa-question-circle question-icon" id="question-mark-performance"style="cursor: pointer; font-size: 24px; color: #C70039; position: absolute; top: 10px; left: 10px;"></i>
        <div class="flashcard-content">
            <i class="fas fa-chart-bar set-icon"></i>
            <h2>Performance</h2>
        </div>
    `;
    // Inside the loadSets function, update the performanceDiv's click event
    performanceDiv.onclick = function () {
        showPerformanceOverlay(); // Show performance overlay
    };



    // Set click event to open the flashcards of the Mistakes set
    mistakesDiv.onclick = function () {
        toggleFlashcards("Mistakes");
    };
    consolidateDiv.onclick = function () {
        updateConsolidateSet();
        toggleFlashcards("Consolidate");
        
    };
    dailyDiv.onclick = function () {
        startDailyQuiz(); 
        
        
    };

    setContainer.appendChild(performanceDiv);

    // Delete button functionality for Mistakes set
    

    // Append the Mistakes div first
    setContainer.appendChild(mistakesDiv);
    setContainer.appendChild(consolidateDiv);
    setContainer.appendChild(dailyDiv);
    console.log(sets)

    // Load and display all other sets
    Object.keys(sets).forEach(setName => {
        if (setName.toLowerCase().includes(filter.toLowerCase())) {
            if (setName !== "Mistakes" && setName !== "Performance" && setName !== "Consolidate" && setName !== "Daily") { // Skip Mistakes and Performance sets since they are already added
                console.log(sets[setName])
                const setDiv = document.createElement("div");
                setDiv.className = 'flashcard'; // General flashcard class
                setDiv.dataset.setName = setName; // Add the data-set-name attribute
                setDiv.draggable = true; // Enable dragging
                
                // Retrieve the description and tags
                const { description, tags } = sets[setName];
                console.log(description);
    
                // Create HTML for description and tags
                const descriptionHTML = description ? `<p class="set-description">${description}</p>` : '';
                console.log(tags)
                const tagsHTML = tags.length ? `<p class="set-tags">${tags.join(', ')}</p>` : '';
    
                setDiv.innerHTML = `
                    <div class="flashcard-content">
                        <h2>${setName}</h2>
                        ${descriptionHTML}  <!-- Add description if available -->
                        ${tagsHTML}  <!-- Add tags if available -->
                        <div class="star-rating" data-set-name="${setName}">
                            <i class="star fas fa-star" data-value="1"></i>
                            <i class="star fas fa-star" data-value="2"></i>
                            <i class="star fas fa-star" data-value="3"></i>
                            <i class="star fas fa-star" data-value="4"></i>
                            <i class="star fas fa-star" data-value="5"></i>
                        </div>
                        <div class="delete-card">-</div>
                    </div>
                `;
                const attempts = performanceData.attemptsBySet[setName] || [];
                const lastAttemptPercentage = attempts.length > 0 ? attempts[attempts.length - 1] : 0;
                
                if (setName !== 'Mistakes' && setName !== 'Consolidate'&& setName !== 'Consolidate') {
                    
                        setDiv.style.background = `
                            linear-gradient(
                                to top, 
                                rgba(76, 175, 80, 1) ${lastAttemptPercentage}%, 
                                rgba(255, 0, 0, 1) 0%
                            )
                        `;
                        setDiv.style.setProperty('--percentage', `${lastAttemptPercentage}%`);
                    
                }
                                 
                                
    
    
                const editButton = document.createElement("button");
                editButton.className = "edit-card";
    
                // Create an icon element
                const editIcon = document.createElement("i");
                editIcon.className = "fas fa-edit"; // Font Awesome edit icon
    
                // Append the icon to the button
                editButton.appendChild(editIcon);
                editButton.onclick = (event) => {
                    event.stopPropagation();
                    editSet(setName);  // Edit set function
                };
                setDiv.querySelector('.flashcard-content').appendChild(editButton);
    
                // Set click event to open the flashcards of the set
                setDiv.onclick = function () {
                    toggleFlashcards(setName);
                };
    
                // Delete button functionality for non-Mistakes and non-Performance sets
                setDiv.querySelector('.delete-card').onclick = function (event) {
                    event.stopPropagation();
                    deleteSet(setName);
                    
                };
    
                // Add drag event listeners
                setDiv.addEventListener('dragstart', dragStart);
                setDiv.addEventListener('dragover', dragOver);
                setDiv.addEventListener('drop', drop);
    
                setContainer.appendChild(setDiv); // Append other sets
            }
        }
    });
    loadQuizResults()
    
}
function createExplanationBox(content) {
    // Remove any existing explanation box
    const existingBox = document.querySelector('.explanation-box');
    if (existingBox) {
        existingBox.remove(); // Remove the existing box if it exists
    }

    const explanationBox = document.createElement("div");
    explanationBox.className = 'explanation-box';
    explanationBox.innerHTML = `
        <div class="explanation-content">
            <p class="expo">${content}</p>
            <button  style="margin-bottom: 30px;" class="close-btn">Close</button>
        </div>
    `;

    // Close button functionality
    explanationBox.querySelector('.close-btn').onclick = function() {
        explanationBox.style.display = 'none'; // Hide the box when close button is clicked
    };

    // Append explanation box to body
    document.body.appendChild(explanationBox);
    
    // Style for explanation box
    explanationBox.style.position = 'fixed';
    explanationBox.style.top = '50%';
    explanationBox.style.left = '50%';
    explanationBox.style.transform = 'translate(-50%, -50%)';
    explanationBox.style.backgroundColor = 'white';
    explanationBox.style.border = '1px solid #ccc';
    explanationBox.style.padding = '20px';
    explanationBox.style.zIndex = '1000'; // Ensure it appears above other content
    explanationBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    explanationBox.style.display = 'block'; // Show the explanation box
}


document.getElementById("question-mark-mistakes").onclick = function(event) {
    event.stopPropagation(); // Stop click from propagating to the flashcard
    createExplanationBox("The Mistakes set contains flashcards that highlight areas where you have previously struggled or made errors. This allows you to focus on and improve those specific topics. Any question previously attempted incorrectly will be added to Mistakes to redo at a later time."); // Create and show the explanation box
    const explanationBox = document.querySelector('.explanation-box');
    explanationBox.style.display = 'block'; // Show the explanation box
    
};
document.getElementById("question-mark-consolidate").onclick = function(event) {
    event.stopPropagation(); // Stop click from propagating to the flashcard
    createExplanationBox("The Consolidate set allows you to reinforce your knowledge and solidify your understanding. It does this through showing flashcards which you have not viewed for a while, and allowing you to refresh your memory on this content."); // Create and show the explanation box
    const explanationBox = document.querySelector('.explanation-box');
    explanationBox.style.display = 'block'; // Show the explanation box
};
document.getElementById("question-mark-daily").onclick = function(event) {
    event.stopPropagation(); // Stop click from propagating to the flashcard
    createExplanationBox("The Daily set helps you establish a routine and improve your skills every day. It does this by randomly drawing ten questions each day from your flashcards to create consistency in revision."); // Create and show the explanation box
    const explanationBox = document.querySelector('.explanation-box');
    explanationBox.style.display = 'block'; // Show the explanation box
};
document.getElementById("question-mark-performance").onclick = function(event) {
    event.stopPropagation(); // Stop click from propagating to the flashcard
    createExplanationBox("The Performance box provides insights into your learning progress and areas to improve. Track average scores and progress over time to boost consistency and development."); // Create and show the explanation box
    const explanationBox = document.querySelector('.explanation-box');
    explanationBox.style.display = 'block'; // Show the explanation box
};
searchBar.addEventListener('input', () => {
    const filter = searchBar.value;
    loadSets(filter);
    hideSetBox();
    initializeStarRating();

    
    
});
function getNextAccessTime() {
    const lastAccess = localStorage.getItem("dailyLastAccess");
    const currentDate = new Date();
    
    if (!lastAccess) {
        return null; // No last access, so it’s available now
    }
    
    const lastAccessDate = new Date(lastAccess);
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const nextAccessTime = new Date(lastAccessDate.getTime() + ONE_DAY_MS);

    return currentDate >= nextAccessTime ? null : nextAccessTime; // Return null if accessible now
}

// Function to start the countdown
function startCountdown(element) {
    const nextAccessTime = getNextAccessTime();
    let countdownInterval; // Declare countdownInterval here

    const updateCountdown = () => {
        const now = new Date();
        const timeRemaining = nextAccessTime - now;
        console.log(nextAccessTime,now)

        if (timeRemaining <= 0) {
            clearInterval(countdownInterval);
            element.innerHTML = "Available now!";
            return;
        }

        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        element.innerHTML = `Next available in: ${hours}h ${minutes}m ${seconds}s`;
    };

    // Update countdown immediately and then every second
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000); // Assign countdownInterval here
}

function getDailyStreak() {
    const lastAccessDate = localStorage.getItem("lastDailyAccess");
    const currentStreak = parseInt(localStorage.getItem("dailyStreak")) || 0;
    
    // Get today's date in a comparable format (e.g., "YYYY-MM-DD")
    const today = new Date().toISOString().split('T')[0];
    
    if (lastAccessDate === today) {
        // Already accessed today, so return the current streak
        return currentStreak;
    } else if (lastAccessDate) {
        const lastAccess = new Date(lastAccessDate);
        const diffInTime = new Date(today) - lastAccess;
        const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 1) {
            // Continue the streak by 1 if accessed daily
            const newStreak = currentStreak + 1;
            localStorage.setItem("dailyStreak", newStreak);
            localStorage.setItem("lastDailyAccess", today);
            return newStreak;
        } else {
            // Reset the streak if more than a day has passed
            localStorage.setItem("dailyStreak", 0);
            localStorage.setItem("lastDailyAccess", today);
            return 1;
        }
    } else {
        // First-time access, so initialize the streak
        localStorage.setItem("dailyStreak", 0);
        localStorage.setItem("lastDailyAccess", today);
        return 1;
    }
}
function editSet(oldName) {
    const overlay = document.getElementById("overlay");
    const inputField = document.getElementById("newSetName");
    const descriptionField = document.getElementById("newSetDescription");
    const tagsField = document.getElementById("newSetTags");

    const { description, tags } = sets[oldName];  // Retrieve current description and tags

    inputField.value = oldName; // Set current name as the default
    descriptionField.value = description || ''; // Set current description (if it exists)
    tagsField.value = tags ? tags.join(', ') : ''; // Set current tags (if they exist)
    

    overlay.style.display = "flex"; // Display the overlay

    // Handle submit button
    document.getElementById("submitNewName").onclick = function() {
        const newSetName = inputField.value.trim();
        const newDescription = descriptionField.value.trim();
        const newTags = tagsField.value.split(",").map(tag => tag.trim()).filter(tag => tag);
        const newTags1 = tagsField.value.trim();
        const maxSetNameLength = 21;
        const maxDescriptionLength = 45;
        const maxTagLength = 45;

        // Validation checks
        if (!newSetName || newSetName.length > maxSetNameLength) {
            alert(`Deck Name must be between 1 and ${maxSetNameLength} characters.`);
            return;
        }

        if (newDescription.length > maxDescriptionLength) {
            alert(`Description must not exceed ${maxDescriptionLength} characters.`);
            return;
        }
        if (newTags1.length > maxTagLength) {
            alert(`Description must not exceed ${maxTagLength} characters.`);
            return;
        }


        if (newSetName && newSetName !== oldName && !sets[newSetName]) {
            if (performanceData.scoresByTopic[oldName]) {
                // Transfer scores to the new set name
                performanceData.scoresByTopic[newSetName] = performanceData.scoresByTopic[oldName];
                delete performanceData.scoresByTopic[oldName]; // Remove old scores
            }
            if (performanceData.attemptsBySet[oldName]) {
                // Transfer attempts to the new set name
                performanceData.attemptsBySet[newSetName] = performanceData.attemptsBySet[oldName];
                delete performanceData.attemptsBySet[oldName]; // Remove old attempts
            }
            // Create a new set with the updated name, description, and tags
            sets[newSetName] = {
                description: newDescription,
                tags: newTags,
                flashcards: sets[oldName].flashcards,
                rating: sets[oldName].rating,
                
            };
            delete sets[oldName]; // Remove the old set
        } else if (newSetName === oldName) {
            // Just update the description and tags
            sets[oldName].description = newDescription;
            sets[oldName].tags = newTags;
        }

        localStorage.setItem('sets', JSON.stringify(sets)); // Save changes
        localStorage.setItem('performanceData', JSON.stringify(performanceData)); // Save changes to performance data
        loadSets(); // Reload the sets
        hideSetBox();
        initializeStarRating();
        
        
        
        overlay.style.display = "none"; // Hide the overlay
    };

    // Handle cancel button
    document.getElementById("cancelEdit").onclick = function() {
        overlay.style.display = "none"; // Hide overlay without changes
    };
}

let draggedElement = null;


function dragStart(event) {
    const targetCard = event.target.closest('.flashcard');
    if (targetCard && targetCard.getAttribute("draggable") === "true") {
        draggedElement = targetCard; // Set dragged element if draggable
        event.dataTransfer.effectAllowed = 'move';
    } else {
        draggedElement = null; // Ignore drag if not draggable
    }
}

function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function drop(event) {
    event.preventDefault();

    const targetCard = event.target.closest('.flashcard');

    // Check if both draggedElement and targetCard are valid, and if draggedElement is draggable
    if (draggedElement && targetCard && draggedElement !== targetCard && draggedElement.getAttribute("draggable") === "true") {
        const allSets = Array.from(setContainer.querySelectorAll('.flashcard'));
        const draggedIndex = allSets.indexOf(draggedElement);
        const targetIndex = allSets.indexOf(targetCard);

        // Insert based on position relative to target
        if (draggedIndex > targetIndex) {
            setContainer.insertBefore(draggedElement, targetCard);
        } else {
            setContainer.insertBefore(draggedElement, targetCard.nextSibling);
        }
    }
}

// Attach event listeners to all `.flashcard` elements
document.querySelectorAll('.flashcard').forEach(card => {
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragover', dragOver);
    card.addEventListener('drop', drop);
});

function showPerformanceOverlay() {
   

    const overlay = document.createElement("div");
    overlay.className = "performance-overlay";

    // Make the overlay scrollable
    
    overlay.style.overflowY = "auto";

    // Calculate performance data
    const { totalQuestionsCreated, totalQuestionsAttempted, totalActiveTime, scoresByTopic, attemptsBySet } = performanceData;

    // Prepare average scores for each topic
    const averageScores = {};
    for (const topic in scoresByTopic) {
        const scores = scoresByTopic[topic];
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        averageScores[topic] = (totalScore / scores.length).toFixed(2);
    }

    // Create dropdown for set selection
    const setOptions = Object.keys(attemptsBySet).map(setName => 
        `<option value="${setName}">${setName}</option>`
    ).join('');
    
    overlay.innerHTML = `
    <div class="overlay-content">
        <h2>Performance Overview</h2>
        
        <div class="performance-stats">
            <p>Questions Created: ${totalQuestionsCreated}</p>
            <p>Questions Attempted: ${totalQuestionsAttempted}</p>
            <p>Active Time: ${formatTime(totalActiveTime)}</p>
        </div>
        
        <div class="charts-container">
            <!-- Average Scores Chart -->
            <canvas id="averageScoresChart" width="400" height="200"></canvas>
            
            <!-- Set Selection and Performance Over Time Chart -->
            <label for="setSelector">Select Set:</label>
            <select id="setSelector" onchange="updatePerformanceOverTimeChart()">
                
                ${setOptions}
            </select>
            <canvas id="performanceOverTimeChart" width="400" height="200"></canvas>
        </div>

        <div class="overlay-close" onclick="hidePerformanceOverlay()">✖️</div>
    </div>
    `;


    // Append the overlay to the body
    document.body.appendChild(overlay);

    // Draw the average scores chart
    drawAverageScoresChart(averageScores);

    // Draw the performance over time chart
    drawPerformanceOverTimeChart("all");
}
function drawAverageScoresChart(averageScores) {
    const ctx = document.getElementById('averageScoresChart').getContext('2d');
    const labels = Object.keys(averageScores);
    const data = Object.values(averageScores);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Scores',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}



function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}
function drawPerformanceOverTimeChart(setName) {
    const ctx = document.getElementById('performanceOverTimeChart').getContext('2d');

    // Clear any existing chart instance to avoid overlapping data
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }

    let labels = [];
    let data = [];
    
    // Prepare data based on selected set or show average for all sets
    if (setName === "all") {
        // Aggregate data across all sets by attempt index
        const allAttempts = {};

        Object.keys(performanceData.attemptsBySet).forEach(set => {
            performanceData.attemptsBySet[set].forEach((attempt, index) => {
                if (!allAttempts[index]) allAttempts[index] = [];
                allAttempts[index].push(attempt);
            });
        });

        // Calculate the average for each attempt across all sets
        labels = Object.keys(allAttempts).map(index => `Attempt ${parseInt(index) + 1}`);
        data = labels.map((_, index) => {
            const attempts = allAttempts[index];
            const average = attempts.reduce((sum, val) => sum + val, 0) / attempts.length;
            return average;
        });
    } else {
        // Filter for specific set
        labels = performanceData.attemptsBySet[setName].map((_, index) => `Attempt ${index + 1}`);
        data = performanceData.attemptsBySet[setName];
    }

    // Draw the line chart for performance over time
    window.performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Performance Over Time',
                data: data,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Modify the dropdown update function to pass the selected set
function updatePerformanceOverTimeChart() {
    const setName = document.getElementById('setSelector').value;
    drawPerformanceOverTimeChart(setName); // Call with selected set
}



function hidePerformanceOverlay() {
    const overlay = document.querySelector(".performance-overlay");
    if (overlay) {
        document.body.removeChild(overlay); // Remove the overlay
    }
}

function toggleFlashcards(setName) {
    document.getElementById("searchBar").style.display = "none";

    const setTitle = document.getElementById("set-title");
    const homeText = document.getElementById("home-text");
    const modeButtons = document.querySelector('.mode-buttons');

    if (flashcardsContainer.style.display === "none" || flashcardsContainer.dataset.currentSet !== setName) {
        flashcardsContainer.style.display = 'flex'; // Show flashcards container
        flashcardsContainer.dataset.currentSet = setName;

        // Show the "Home" text and update the title with the set name
        homeText.style.display = 'block';
        setTitle.textContent = setName;
        setTitle.style.display = 'block';
        modeButtons.style.display = 'flex'; // Show mode buttons

        // Load existing flashcards for the current set
        loadFlashcards(setName);
        hideSetBox();
        hideCardBox();

        // Hide other sets
        Array.from(setContainer.children).forEach(set => {
            if (!set.classList.contains('add-set')) {
                set.style.display = 'none';
            }
        });
        document.querySelector('.add-set').style.display = 'none';
    } else {
        // Hide flashcards container and reset to home view
        goHome();
    }
}

function addToMistakesSet(card) {
    // Create a new card structure for the Mistakes set
    console.log(card);
    const mistakeCard = {
        myQuestion: card.myQuestion,
        myAnswer: card.myAnswer, // Make sure to include the answer if you want it
        questionImage: card.questionImage,  // Include question image
        answerImage: card.answerImage 
    };
    

    // Avoid duplicates by checking if the question already exists in the Mistakes set
    if (!sets["Mistakes"].some(mistake => 
        mistake.myQuestion === mistakeCard.myQuestion &&
        mistake.myAnswer === mistakeCard.myAnswer &&
        mistake.questionImage === mistakeCard.questionImage &&
        mistake.answerImage === mistakeCard.answerImage
    )) {
        sets["Mistakes"].push(mistakeCard);
        console.log("Added to mistakes:", mistakeCard);
        localStorage.setItem('sets', JSON.stringify(sets));
    }
}

function answerQuestion(isCorrect) {
    const currentSet = flashcardsContainer.dataset.currentSet;
    if (currentSet !== 'Consolidate' && currentSet !=='Mistakes'&& currentSet !== "Daily"){

        card = sets[currentSet].flashcards[currentQuizIndex];
    }
    if (currentSet == 'Consolidate' || currentSet =='Mistakes' || currentSet=='Daily'){

        card = sets[currentSet][currentQuizIndex];
    }
    if (isCorrect){

        markAsAttempted(currentSet, currentQuizIndex);
    }
    

    // Increment the total questions attempted
    performanceData.totalQuestionsAttempted++;
    localStorage.setItem('performanceData', JSON.stringify(performanceData))

    // Add to Mistakes set if the answer is incorrect
    if (!isCorrect && currentSet !== 'Mistakes') {
        console.log(card);
        addToMistakesSet(card);
        
    } else if (isCorrect && currentSet === 'Mistakes') {
        // Remove the card from Mistakes set if answered correctly
        removeFromMistakesSet(card);
        addonnumber++;
        currentQuizIndex -= 1;
    }

    // Update the scores for the current topic
    if (!performanceData.scoresByTopic[currentSet]) {
        performanceData.scoresByTopic[currentSet] = [];
    }
    performanceData.scoresByTopic[currentSet].push(isCorrect ? 1 : 0); // Store 1 for correct, 0 for incorrect

    if (isCorrect) {
        correctAnswers++;
    }

    currentQuizIndex++;
    const setName = flashcardsContainer.dataset.currentSet;

    // Update the progress bar
    updateProgressBar(); 
    saveQuizProgress();
    
    if (setName!== 'Consolidate' && setName !=='Mistakes' && setName !=='Daily'){

        if (currentQuizIndex < sets[setName].flashcards.length) {
            showQuizCard();
        } 
        else if (sets[setName].flashcards.length===0){
            return
            
        }else {
            showQuizResults();

        }
    }
    if (setName== 'Consolidate' ||setName =='Mistakes'|| setName =='Daily'){

        if (currentQuizIndex < sets[setName].length) {
            showQuizCard();
        } 
        else if (sets[setName].length===0){
            return
            
        }else {
            showQuizResults();

        }
    }
}



function loadFlashcards(setName) {
    flashcardsContainer.innerHTML = ''; // Clear existing flashcards

    // Create the add flashcard button and add it to the beginning
    const addCardDiv = document.createElement("div");

    addCardDiv.className = 'flashcard add-set';
    addCardDiv.onclick = function() {
        showCardBox(); // Show the card box
    };
    addCardDiv.innerHTML = `<div class="flashcard>
        <div class =" flashcard-content">
            <i class="fas fa-plus set-icon"></i>
            <h2>Add Flashcard </h2>
        </div>
    </div>`;
    if (setName !== 'Mistakes'&& setName !== 'Consolidate'&& setName !== "Daily"){

        flashcardsContainer.appendChild(addCardDiv); // Insert as the first element
    } 
    

    // Load each flashcard in the set
    if (setName === "Consolidate" || setName === 'Mistakes'|| setName === "Daily"){
        sets[setName].forEach(card => divMaker(card));
    }else{
        sets[setName].flashcards.forEach(card => divMaker(card));
    }
    
    
}

function setMode(mode) {
    const currentSet = flashcardsContainer.dataset.currentSet;

    // Check if the current set has flashcards
    if (mode === 'quiz') {
        console.log(currentSet)
        if (!sets[currentSet] || !sets[currentSet].flashcards || sets[currentSet].flashcards.length === 0)  {
            if (currentSet!=='Consolidate' && currentSet!='Mistakes' && currentSet !== "Daily"){
                alert("Cannot start quiz: There are no flashcards in the current set.");
                return; // 

            }
            
            
            
            
        }


        currentQuizIndex = 0; // Reset index for quiz mode
        correctAnswers = 0; // Reset correct answers count
        addonnumber = 0;

        // Show the progress bar
        progressBarContainer.style.display = 'block';
        progressBar.style.width = '0%'; // Reset progress bar width

        // Start active timer
        
        activeTimer = setInterval(() => {
            performanceData.totalActiveTime++;
        }, 1 * 1000); // Update every second
        localStorage.setItem('performanceData', JSON.stringify(performanceData))

        // Add large flashcard class
        flashcardsContainer.classList.add('flashcard-large');

        showQuizCard();
    


    } else {
        // Remove large flashcard class
        flashcardsContainer.classList.remove('flashcard-large');
        
        progressBarContainer.style.display = 'none';
        showFlashcards();
    }
}



function showFlashcards() {
    const setName = flashcardsContainer.dataset.currentSet;
    flashcardsContainer.innerHTML = ''; // Clear flashcards for a fresh view
    loadFlashcards(setName); // Load flashcards in view mode
}

function showQuizCard() {
    const setName = flashcardsContainer.dataset.currentSet;
    flashcardsContainer.innerHTML = ''; // Clear existing flashcards

    
    if (setName !== 'Consolidate' && setName !=='Mistakes'&& setName !== "Daily"){
        if (sets[setName].flashcards.length > 0 && currentQuizIndex < sets[setName].flashcards.length) {
            const card = sets[setName].flashcards[currentQuizIndex];
            const newDiv = document.createElement("div");
            newDiv.className = 'flashcard';
    
            newDiv.innerHTML = `
                <h2 class="card-label">Question:</h2>
                <h2 class="card-question">${card.myQuestion}</h2>
                <img class="question-image" src="${card.questionImage || ''}"  style="max-width: 150px; height: auto;" />
                <div class="delete-card" onclick="deleteCard(card.myQuestion,card.myAnswer,card.questionImage,card.answerImage)">-</div>
            `;
    
            // Add an event listener to reveal the answer when the card is clicked
            newDiv.onclick = function () {
                revealAnswer(card, newDiv);
            };
    
            flashcardsContainer.appendChild(newDiv); // Add the flashcard for the current question
            flashcardsContainer.style.display = 'flex'; // Ensure it's visible
        } else {
            showQuizResults(); // Show results if quiz is complete
        }

    }
    if (setName == 'Consolidate' || setName =='Mistakes'|| setName == "Daily"){
        console.log(sets[setName].length)
        if (sets[setName].length > 0 && currentQuizIndex < sets[setName].length) {
            const card = sets[setName][currentQuizIndex];
            const newDiv = document.createElement("div");
            newDiv.className = 'flashcard';
    
            newDiv.innerHTML = `
                <h2 class="card-label">Question:</h2>
                <h2 class="card-question">${card.myQuestion}</h2>
                <img class="question-image" src="${card.questionImage || ''}"  style="max-width: 150px; height: auto;" />
                <div class="delete-card" onclick="deleteCard(card.myQuestion,card.myAnswer,card.questionImage,card.answerImage)">-</div>
            `;
    
            // Add an event listener to reveal the answer when the card is clicked
            newDiv.onclick = function () {
                revealAnswer(card, newDiv);
            };
    
            flashcardsContainer.appendChild(newDiv); // Add the flashcard for the current question
            flashcardsContainer.style.display = 'flex'; // Ensure it's visible
        } else {
            showQuizResults(); // Show results if quiz is complete
        }

    }


    
}

function revealAnswer(card, newDiv) {
    newDiv.innerHTML = `
        
        <h2 class="card-label">Answer:</h2>
        <h2 class="card-answer">${card.myAnswer}</h2>
        <img class="answer-image" src="${card.answerImage || ''}" style="max-width: 150px; height: auto;" />
        <div class="quiz-buttons-container">
            <div class="quiz-buttons">
                <button onclick="answerQuestion(true)">✔️</button>
                <button onclick="answerQuestion(false)">❌</button>
            </div>
        </div>
    `;
}

function goHome() {
    flashcardsContainer.style.display = 'none';
    flashcardsContainer.classList.remove('flashcard-large');
    document.getElementById("searchBar").style.display = "block";

    flashcardsContainer.innerHTML = '';
    progressBarContainer.style.display = 'none';
    

    // Stop active timer if it's running
    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }

    document.querySelector('.add-set').style.display = 'flex';
    Array.from(setContainer.children).forEach(set => {
        if (!set.classList.contains('add-set')) {
            set.style.display = 'flex';
        }
    });

    const setTitle = document.getElementById("set-title");
    const homeText = document.getElementById("home-text");
    setTitle.style.display = 'none';
    homeText.style.display = 'none';
    modeButtons.style.display = 'none'; // Hide mode buttons
    hideSetBox();
    hideCardBox();
}

function divMaker(card) { 
    const newDiv = document.createElement("div");
    newDiv.className = 'flashcard';
    newDiv.style.position = "relative"; // Ensure the button is positioned relative to the flashcard

    // Create the "+" button
    const plusButton = document.createElement("button");
    plusButton.className = 'plus-button';
    plusButton.innerHTML = "+";
    plusButton.style.position = "absolute"; // Positioning the button in the top right
    plusButton.style.top = "10px";
    plusButton.style.right = "5px"; // Adjust position to the left of the edit button
    plusButton.style.backgroundColor = "blue"; // Blue background for the button
    plusButton.style.color = "white"; // White text for contrast
    plusButton.style.border = "none"; // No border
    plusButton.style.padding = "5px 10px"; // Padding for the button
    plusButton.style.cursor = "pointer"; // Pointer cursor for the button

    // Prevent the flashcard toggle when clicking the button
    plusButton.onclick = function(event) {
        event.stopPropagation(); // Stop click from propagating to the flashcard
        openOverlay(card); // Open the overlay with the card content
    };

    // Create the "Edit" button
    const editButton = document.createElement("button");
    editButton.className = 'edit-button';
    editButton.innerHTML = "✎"; // Edit logo (you can use an icon library instead)
    editButton.style.position = "absolute"; // Positioning the button in the top right
    editButton.style.top = "10px";
    editButton.style.left = "40px"; // Adjust position to the right
    editButton.style.backgroundColor = "yellow"; // Yellow background for the button
    editButton.style.color = "black"; // Black text for contrast
    editButton.style.border = "none"; // No border
    editButton.style.padding = "5px 10px"; // Padding for the button
    editButton.style.cursor = "pointer"; // Pointer cursor for the button
    editButton.style.borderRadius = "5px"; // Rounded corners for the button

    // Prevent the flashcard toggle when clicking the button
    editButton.onclick = function(event) {
        event.stopPropagation(); // Stop click from propagating to the flashcard
        editCard(card); // Call the editCard function (to be defined)
    };

    // Building the question content
    let questionContent = `<h2 class="card-label">Question:</h2>`;
    
    if (card.myQuestion) {
        let questionTextStyle = '';
        if (card.myQuestion.length > 72) {
            questionTextStyle = 'style="font-size: 12px;"'; // Font size for questions longer than 72 characters
        } else if (card.myQuestion.length > 52) {
            questionTextStyle = 'style="font-size: 16px;"'; // Font size for questions longer than 52 characters
        }
        questionContent += `<h2 class="card-question" ${questionTextStyle}>${card.myQuestion}</h2>`;
    }
    
    if (card.questionImage) {
        questionContent += `<img class="question-image" src="${card.questionImage}" alt="Question Image" style="max-width: 150px; max-height: 60%;"/>`; // Adjusted max-width to 150px
    }

    // Building the answer content
    let answerContent = `<h2 class="answer-label" style="display: none;">Answer:</h2>`;
    
 
    if (card.myAnswer) {
        let answerTextStyle = '';
        if (card.myAnswer.length > 72) {
            answerTextStyle = 'style="font-size: 12px;"'; // Font size for answers longer than 72 characters
        } else if (card.myAnswer.length > 52) {
        answerTextStyle = 'style="font-size: 16px; display: none;"'; // Font size for answers longer than 52 characters
        }
        answerContent += `<h2 class="card-answer" style="display:none;"   ${answerTextStyle}>${card.myAnswer} </h2>`;
    }
    
    if (card.answerImage) {
        answerContent += `<img class="answer-image" src="${card.answerImage}" alt="Answer Image" style="max-width: 150px; max-height: 60%; display: none;"/>`; // Adjusted max-width to 150px and hidden by default
    }

    // Combine question and answer content
    newDiv.innerHTML += questionContent + answerContent + `<div class="delete-card">-</div>`;

    // Prepend the buttons to the card to make them the first children
    newDiv.insertBefore(plusButton, newDiv.firstChild);
    newDiv.insertBefore(editButton, newDiv.firstChild); // Add edit button before the plus button

    // Select elements for toggling visibility
    const answerElement = newDiv.querySelector(".card-answer");
    const answerLabel = newDiv.querySelector(".answer-label");
    const cardLabel = newDiv.querySelector(".card-label");
    const questionElement = newDiv.querySelector(".card-question");
    const answerImage = newDiv.querySelector(".answer-image");
    const questionImage = newDiv.querySelector(".question-image");

    // Toggle answer and image visibility on click
    newDiv.onclick = function () {
        // Determine if the answer is visible based on the answer text or image
        const isAnswerVisible = (answerElement && answerElement.style.display === "block") ||
                                (answerImage && answerImage.style.display === "block")||
                                (answerLabel && answerLabel.style.display === "block"); // Check if answer is visible
    
        // Toggle visibility of answer text and image
        if (answerElement) {
            answerElement.style.display = isAnswerVisible ? "none" : "block";
        }
        if (answerLabel) {
            answerLabel.style.display = isAnswerVisible ? "none" : "block";
        }
        if (answerImage) {
            answerImage.style.display = isAnswerVisible ? "none" : "block"; // Toggle answer image
        }
        if (cardLabel) {
            cardLabel.style.display = isAnswerVisible ? "block" : "none";
        }
        if (questionElement) {
            questionElement.style.display = isAnswerVisible ? "block" : "none";
        }
        if (questionImage) {
            questionImage.style.display = isAnswerVisible ? "block" : "none"; // Toggle question image
        }
    };
    

    // Delete card functionality
    newDiv.querySelector('.delete-card').onclick = function (event) {
        event.stopPropagation(); // Prevent flashcard click event
        deleteCard(card.myQuestion,card.myAnswer,card.questionImage,card.answerImage);
    };

    // Append the newly created flashcard to the container
    flashcardsContainer.appendChild(newDiv);
    
    console.log(newDiv);
}


// Example edit function (you can modify as needed)
let currentCardToEdit = null; // Variable to hold the card being edited

function editCard(card) {
    currentCardToEdit = card; // Store the card to edit
    document.getElementById("question").value = card.myQuestion || ""; // Pre-fill the question
    document.getElementById("answer").value = card.myAnswer || ""; // Pre-fill the answer

    // Handle question image
    if (card.questionImage) {
        document.getElementById("questionImagePreview").src = card.questionImage;
        document.getElementById("questionImagePreview").style.display = "block";
    } else {
        document.getElementById("questionImagePreview").style.display = "none";
    }

    // Handle answer image
    if (card.answerImage) {
        document.getElementById("answerImagePreview").src = card.answerImage;
        document.getElementById("answerImagePreview").style.display = "block";
    } else {
        document.getElementById("answerImagePreview").style.display = "none";
    }

    // Show the card creation box
    document.getElementById("card-box").style.display = "block"; 
}



// Function to open overlay
function openOverlay(card) {
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "1000";

    const overlayContent = document.createElement("div");
    overlayContent.style.backgroundColor = "white";
    overlayContent.style.padding = "20px";
    overlayContent.style.borderRadius = "10px";
    overlayContent.style.width = "60%"; // Set width to 60% of the screen
    overlayContent.style.maxHeight = "80%"; // Limit height to 80% of the screen height
    overlayContent.style.overflowY = "auto"; // Allow vertical scrolling if content overflows
    overlayContent.style.position = "relative"; // Relative positioning for close button
    overlayContent.style.textAlign = "center";

    // Create question and answer elements
    const questionElement = document.createElement("div");
    questionElement.innerHTML = `
        <h2>Question:</h2>
        <h3>${card.myQuestion || ''}</h3>
        ${card.questionImage ? `<img src="${card.questionImage}" alt="Question Image" style="max-width: 100%; height: auto;"/>` : ''}
    `;
    questionElement.style.display = "block"; // Initially show question

    const answerElement = document.createElement("div");
    answerElement.innerHTML = `
        <h2>Answer:</h2>
        <h3>${card.myAnswer || ''}</h3>
        ${card.answerImage ? `<img src="${card.answerImage}" alt="Answer Image" style="max-width: 100%; height: auto;"/>` : ''}
    `;
    answerElement.style.display = "none"; // Initially hide answer

    // Add both question and answer to overlayContent
    overlayContent.appendChild(questionElement);
    overlayContent.appendChild(answerElement);

    // Add close button
    const closeButton = document.createElement("div");
    closeButton.className = "close-button";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.cursor = "pointer";
    closeButton.style.fontSize = "24px";
    closeButton.style.color = "black";
    closeButton.innerHTML = "&times;"; // Close button as X

    // Toggle question and answer visibility on click
    overlayContent.onclick = function() {
        const isAnswerVisible = answerElement.style.display === "block";
        questionElement.style.display = isAnswerVisible ? "block" : "none"; // Show question if answer is visible
        answerElement.style.display = isAnswerVisible ? "none" : "block"; // Show answer if question is visible
    };

    // Add event listener to close the overlay when the close button is clicked
    closeButton.onclick = function(event) {
        event.stopPropagation(); // Prevent triggering the click event for the overlay
        document.body.removeChild(overlay);
    };

    overlayContent.appendChild(closeButton);
    overlay.appendChild(overlayContent);
    document.body.appendChild(overlay);
}






function showQuizResults() {
    const setName = flashcardsContainer.dataset.currentSet;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Get the current date in a comparable format (e.g., "YYYY-MM-DD")
    const currentDate = new Date().toISOString().split("T")[0];
    const lastAccess = localStorage.getItem("dailyLastAccess");
    const currentStreak = parseInt(localStorage.getItem("dailyStreak"), 10) || 0;
    

    if (setName !== 'Consolidate' && setName !== 'Mistakes' && setName !== 'Daily') {
        percentageCorrect = (correctAnswers / (sets[setName].flashcards.length + addonnumber)) * 100;
       
    } else {
        percentageCorrect = (correctAnswers / (sets[setName].length + addonnumber)) * 100;
        console.log(addonnumber);
         // If we're here because "Mistakes" set is empty, percentageCorrect should already be 100%
         if (sets[setName].length === 0 && setName==='Mistakes') {
            percentageCorrect = 100; // Redundant safeguard
        }
    }

    // Update daily access and streak only if this is the "Daily" set
    if (setName === 'Daily') {
        // Save current access date in localStorage
        localStorage.setItem("dailyLastAccess", currentDate);
        

        if (lastAccess && new Date(currentDate) - new Date(lastAccess) === ONE_DAY_MS) {
            // Increment streak by 1 if lastAccess was exactly 24 hours ago
            localStorage.setItem("dailyStreak", currentStreak + 1);
        } else {
            // Reset streak if it's not a consecutive day
            localStorage.setItem("dailyStreak", 0);
        }
        const dailyDiv = document.querySelector('.flashcard.daily-set'); // Adjust this selector as needed
        const countdownElement = dailyDiv.querySelector("#countdown"); // Ensure the countdown element exists
        
        if (countdownElement) {
            startCountdown(countdownElement); // Pass the countdown element to the countdown function
        }
 

        displayStreak(); // Display streak to user (if needed)
    }

    // Track accuracy percentage in performanceData for the set
    if (!performanceData.attemptsBySet) {
        performanceData.attemptsBySet = {}; // Initialize if it doesn't exist
    }

    if (!performanceData.attemptsBySet[setName]) {
        performanceData.attemptsBySet[setName] = [];
    }
    performanceData.attemptsBySet[setName].push(percentageCorrect);

    // Display quiz results
    flashcardsContainer.innerHTML = `
        <div class="quiz-results">
            <h2 class="quiz-title">Quiz Complete!</h2>
            <h3 class="score-label">Your Score:</h3>
            <h3 class="score">${percentageCorrect.toFixed(2)}%</h3>
        </div>
    `;

    const setDiv = document.querySelector(`#set-container .flashcard[data-set-name="${setName}"]`);
    if (setDiv && setName !== 'Mistakes' && setName !== 'Consolidate') {
        setDiv.style.background = `
            linear-gradient(
                to top, 
                rgba(76, 175, 80, 1) ${percentageCorrect}%, 
                rgba(255, 0, 0, 1) 0%
            )
        `;
        setDiv.style.setProperty('--percentage', `${percentageCorrect}%`);
    }
    console.log("Quiz Percentage:", percentageCorrect);
    
    clearInterval(activeTimer);
    activeTimer = null;

    // Re-render performance overlay if it's open
    const overlay = document.querySelector(".performance-overlay");
    if (overlay) {
        hidePerformanceOverlay();
        showPerformanceOverlay();
    }
    saveQuizProgress();
}

function loadQuizResults() {
    const savedPerformanceData = localStorage.getItem('performanceData');

    if (savedPerformanceData) {
        performanceData = JSON.parse(savedPerformanceData);
    } else {
        // Initialize performanceData if not set
        performanceData = {
            totalQuestionsCreated: 0,
            totalQuestionsAttempted: 0,
            totalActiveTime: 0,
            scoresByTopic: {}, // { topicName: [scores array] }
            attemptsBySet: {}   // { setName: [percentage accuracy history] }
        };
    }
}



// Function to add or update the card
function addCard() {
    const question = document.getElementById("question").value;
    const answer = document.getElementById("answer").value;

    const questionImage = document.getElementById("questionImagePreview").src; // Get the image URL
    const answerImage = document.getElementById("answerImagePreview").src; // Get the image URL
    const maxCharacters = 100;

    if (question.length > maxCharacters) {
        alert(`Question must not exceed ${maxCharacters} characters.`);
        return;
    }
    if (answer.length > maxCharacters) {
        alert(`Answer must not exceed ${maxCharacters} characters.`);
        return;
    }

    if (currentCardToEdit) {
        // Update existing card
        currentCardToEdit.myQuestion = question;
        currentCardToEdit.myAnswer = answer;
        
        // Only update the image URLs if they exist
        if (questionImage && questionImage !== "") {
            currentCardToEdit.questionImage = questionImage;
        }
        if (answerImage && answerImage !== "") {
            currentCardToEdit.answerImage = answerImage;
        }

        // Refresh the display of the updated card (optional)
        refreshCardDisplay(currentCardToEdit);
        
        currentCardToEdit = null; // Clear the edit state after saving

        const currentSet = flashcardsContainer.dataset.currentSet;
        if (currentSet) {
            localStorage.setItem('sets', JSON.stringify(sets));
        }
    } else {
        // Create a new card
        const newCard = {
            myQuestion: question,
            myAnswer: answer,
            questionImage: questionImage,
            answerImage: answerImage
        };
        divMaker(newCard); // Create a new flashcard
        performanceData.totalQuestionsCreated++;
        localStorage.setItem('performanceData', JSON.stringify(performanceData))
        const currentSet = flashcardsContainer.dataset.currentSet;
        if (currentSet) {
            sets[currentSet].flashcards.push(newCard);
            localStorage.setItem('sets', JSON.stringify(sets));
        }
    }

    // Hide the card box
    hideCardBox();
}


function handleImageUpload(inputId, previewId, removeButtonId, previewContainerId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const removeButton = document.getElementById(removeButtonId);
    const previewContainer = document.getElementById(previewContainerId);
    
    input.addEventListener('change', function () {
        const file = input.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.src = e.target.result;
                previewContainer.style.display = 'flex'; // Show the image preview and remove button
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.style.display = 'none'; // Hide the preview if no file is selected
        }
    });

    // Remove Image functionality
    removeButton.addEventListener('click', function () {
        input.value = ''; // Clear the input field
        preview.src = ''; // Clear the image preview
        previewContainer.style.display = 'none'; // Hide the image preview and remove button
    });
}

// Function to populate the form for editing an existing card
function populateFormForEditing(card) {
    document.getElementById('question').value = card.myQuestion;
    document.getElementById('answer').value = card.myAnswer;

    // Set the preview for question image if it exists
    if (card.questionImage) {
        document.getElementById('questionImagePreview').src = card.questionImage;
        document.getElementById('questionImagePreviewContainer').style.display = 'flex';
    } else {
        document.getElementById('questionImagePreviewContainer').style.display = 'none';
    }

    // Set the preview for answer image if it exists
    if (card.answerImage) {
        document.getElementById('answerImagePreview').src = card.answerImage;
        document.getElementById('answerImagePreviewContainer').style.display = 'flex';
    } else {
        document.getElementById('answerImagePreviewContainer').style.display = 'none';
    }
}

// Initialize image upload and remove functionality for both images
handleImageUpload('questionImage', 'questionImagePreview', 'removeQuestionImage', 'questionImagePreviewContainer');
handleImageUpload('answerImage', 'answerImagePreview', 'removeAnswerImage', 'answerImagePreviewContainer');


function refreshCardDisplay(card) {
    // Find the flashcard element in the DOM that corresponds to the edited card
    const flashcardElements = document.querySelectorAll('.flashcard');

    flashcardElements.forEach((element) => {
        const questionElement = element.querySelector('.card-question');
        if (questionElement && questionElement.textContent === card.myQuestion) {
            // Update the display for this card
            questionElement.textContent = card.myQuestion === null ? '' : card.myQuestion;
            const answerElement = element.querySelector('.card-answer');
            answerElement.textContent = card.myAnswer === null ? '' : card.myAnswer; // Update answer text
            
            // Update images if they exist
            const questionImageElement = element.querySelector('.question-image');
            if (questionImageElement) {
                questionImageElement.src = card.questionImage || ''; // Update question image
            }

            const answerImageElement = element.querySelector('.answer-image');
            if (answerImageElement) {
                answerImageElement.src = card.answerImage || ''; // Update answer image
            }
        }
        const currentSet = flashcardsContainer.dataset.currentSet;
        if (currentSet) {
            
            localStorage.setItem('sets', JSON.stringify(sets));
            loadFlashcards(currentSet); // Reload the flashcards
        }
    });
}




function deleteCard(question, answer, questionImage, answerImage) {
    const currentSet = flashcardsContainer.dataset.currentSet;
    console.log(currentSet);
    console.log(sets);

    const isExactMatch = (card) => 
        card.myQuestion === question && 
        card.myAnswer === answer && 
        card.questionImage === questionImage && 
        card.answerImage === answerImage;

    if (currentSet !== 'Consolidate' && currentSet !== 'Mistakes'&& currentSet !== "Daily") {
        if (currentSet) {
            // Filter out only the exact match in the flashcards array
            sets[currentSet].flashcards = sets[currentSet].flashcards.filter(card => !isExactMatch(card));
            localStorage.setItem('sets', JSON.stringify(sets));
            loadFlashcards(currentSet); // Reload the flashcards
        }
    } else if (currentSet === 'Consolidate' || currentSet === 'Mistakes'|| currentSet==='Daily') {
        if (currentSet) {
            // Filter out only the exact match in the main set array
            sets[currentSet] = sets[currentSet].filter(card => !isExactMatch(card));
            localStorage.setItem('sets', JSON.stringify(sets));
            loadFlashcards(currentSet); // Reload the flashcards
        }
    }
}


function deleteSet(setName) {
    delete sets[setName];
    localStorage.setItem('sets', JSON.stringify(sets));
    loadSets(); // Reload sets
    initializeStarRating();
    hideSetBox();
    
    
}

function removeFromMistakesSet(question) {
    console.log(sets["Mistakes"])
    console.log(question)
    // Remove the card from the Mistakes set
    sets["Mistakes"] = sets["Mistakes"].filter(mistake => 
        mistake.myQuestion !== card.myQuestion ||
        mistake.myAnswer !== card.myAnswer ||
        mistake.questionImage !== card.questionImage ||
        mistake.answerImage !== card.answerImage
    );
    localStorage.setItem('sets', JSON.stringify(sets));
    if (sets["Mistakes"].length === 0) {
        showQuizResults(); // Show results if quiz is complete
    }

}
function newSetShown() {
    setBox.style.display = 'block';
}

function hideSetBox() {
    setBox.style.display = 'none';
}

function showCardBox() {
    document.getElementById("question").value = '';
    document.getElementById("answer").value = '';
    cardBox.style.display = 'block'; // Show the card box
}

function hideCardBox() {
    cardBox.style.display = 'none'; // Hide flashcard input
    currentCardToEdit = null; // Clear the edit state when hiding the box
}

// Handle file input from the dropzone
function setupDropzone(dropzoneId, fileInputId, previewId) {
    const dropzone = document.getElementById(dropzoneId);
    const fileInput = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);

    // Show file input when the dropzone is clicked
    dropzone.onclick = function() {
        fileInput.click();
    };

    // Handle drag and drop
    dropzone.ondrop = function(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files; // Set the file input files
            updateImagePreview(fileInput, preview); // Update the preview
        }
    };

    // Handle file selection
    fileInput.onchange = function() {
        updateImagePreview(fileInput, preview);
    };

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
}

// Prevent default behavior (Prevent file from being opened)
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Update image preview
function updateImagePreview(input, preview) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block'; // Show the image
        };
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none'; // Hide the image if no file
    }
}
// Initialize the dropzone setup for both question and answer image uploads
setupDropzone('questionDropzone', 'questionImage', 'questionImagePreview');
setupDropzone('answerDropzone', 'answerImage', 'answerImagePreview');

// Function to initialize the star rating system
function initializeStarRating() {
    const starRatings = document.querySelectorAll('.star-rating');

    starRatings.forEach(ratingDiv => {
        const setName = ratingDiv.dataset.setName;

        // Retrieve stored rating for the set (if it exists)
        let storedRating = sets[setName].rating || 0;

        // Fill stars based on the stored rating
        updateStarDisplay(ratingDiv, storedRating);
        hideSetBox();

        // Add click event listener to each star
        ratingDiv.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', function (event) {
                event.stopPropagation()
                const selectedRating = parseInt(star.dataset.value);

                // Update the display
                updateStarDisplay(ratingDiv, selectedRating);

                // Store the rating in the set object and in localStorage
                sets[setName].rating = selectedRating;
                localStorage.setItem('sets', JSON.stringify(sets));
            });
        });
    });
}

// Function to update the star display (fill stars up to the given rating)
function updateStarDisplay(ratingDiv, rating) {
    console.log(ratingDiv,rating)
    ratingDiv.querySelectorAll('.star').forEach(star => {
        if (parseInt(star.dataset.value) <= rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });
}

// After you load the sets, call this function to initialize the stars


// Function to toggle the theme selector visibility
function toggleThemeSelector() {
    const themeSelector = document.getElementById('theme-selector');
    themeSelector.style.display = themeSelector.style.display === 'none' ? 'flex' : 'none';
}

// Function to close the theme selector
function closeThemeSelector() {
    document.getElementById('theme-selector').style.display = 'none';
}

// Function to change a CSS variable color and save it to localStorage
function changeColor(variable, value) {
    document.documentElement.style.setProperty(variable, value); // Apply the color change
    localStorage.setItem(variable, value); // Save the color to localStorage
}

// Function to load colors from localStorage when the page loads
function loadColors() {
    const color1 = localStorage.getItem('--color1') || '#add8e6';
    const color2 = localStorage.getItem('--color2') || '#87cefa';
    const color3 = localStorage.getItem('--color3') || '#b0e0e6';

    // Apply the stored colors to the document
    document.documentElement.style.setProperty('--color1', color1);
    document.documentElement.style.setProperty('--color2', color2);
    document.documentElement.style.setProperty('--color3', color3);

    // Set the input values in the theme selector to match the stored colors
    document.getElementById('color1').value = color1;
    document.getElementById('color2').value = color2;
    document.getElementById('color3').value = color3;
}

function loadTheme() {
    // Load colors
    const color1 = localStorage.getItem('--color1') || '#add8e6';
    const color2 = localStorage.getItem('--color2') || '#87cefa';
    const color3 = localStorage.getItem('--color3') || '#b0e0e6';

    document.documentElement.style.setProperty('--color1', color1);
    document.documentElement.style.setProperty('--color2', color2);
    document.documentElement.style.setProperty('--color3', color3);

    // Update the color input values
    document.getElementById('color1').value = color1;
    document.getElementById('color2').value = color2;
    document.getElementById('color3').value = color3;

    // Load and apply the pattern
    const selectedPattern = localStorage.getItem('selectedPattern') || 'triangles';
    document.body.classList.add(selectedPattern);

    // Set the pattern selector to the saved pattern
    document.getElementById('pattern-selector').value = selectedPattern;
}

// Call loadTheme on page load
window.onload = loadTheme;
function changePattern(pattern) {
    // Remove existing pattern class
    document.body.classList.remove('triangles','gradient','slants','equals','overlappingcircles','stairway', 'vertical-lines', 'horizontal-lines', 'diagonal-stripes', 'polka-dots', 'zigzag', 'checkerboard', 'waves');


    // Add the selected pattern class
    document.body.classList.add(pattern);
    // Save the pattern selection to localStorage
    localStorage.setItem('selectedPattern', pattern);
}