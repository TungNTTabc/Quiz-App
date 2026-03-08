const progressBar = document.querySelector(".progress-bar"),
    progressText = document.querySelector(".progress-text");
const progress = (value) => {
    const percentage = (value/time)*100;
    progressBar.style.width = `${percentage}%`;
    progressText.innerHTML = `${value}`;
}
let questions = [],
    time = 30,
    score = 0,
    currentQuestion,
    timer;
const startBtn = document.querySelector(".start"),
    numQuestions = document.querySelector("#num-questions"),
    category = document.querySelector("#category"),
    difficulty = document.querySelector("#difficulty"),
    timePerQuestion = document.querySelector("#time"),
    quiz = document.querySelector(".quiz"),
    startscreen = document.querySelector(".start-screen");
// const startQuiz = () =>{
//     const num = numQuestions.value;
//     cat = category.value;
//     diff = difficulty.value;
//     const api = `https://opentdb.com/api.php?
//     amount=${num}&category=${cat}&difficulty=${diff}&type=multiple`
//     fetch(api)
//         .then((res) => res.json())
//         .then((data) => {
//             questions = data.results;
//             startscreen.classList.add("hide");
//             quiz.classList.remove("hide");
//             currentQuestion = 1;
//             showQuestion(questions[0]);
//         });
// };
const loadPreparedQuestions = async () => {
    const res = await fetch("questions.txt");
    const text = await res.text();
    const lines = text.split("\n");
    let parsedQuestions = [];
    let currentQuestion = null;
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        if (line.startsWith("Câu")) {
            if (currentQuestion) {
                parsedQuestions.push(currentQuestion);
            }
            currentQuestion = {
                question: line.replace("Câu", "").trim(),
                correct_answer: "",
                incorrect_answers: []
            };
        } else if (line.includes(":)))")) {
            currentQuestion.correct_answer = line.replace(":)))", "").trim();
        } else if (line.includes(":(((")) {
            currentQuestion.incorrect_answers.push(
                line.replace(":(((", "").trim()
            );
        }
    });
    if (currentQuestion) {
        parsedQuestions.push(currentQuestion);
    }
    return parsedQuestions.sort(() => Math.random() - 0.5);
};
const startQuiz = async () => {
    const num = numQuestions.value;
    const cat = category.value;
    const diff = difficulty.value;
    if (cat == "1") {
        const data = await loadPreparedQuestions();
        questions = data.slice(0, num);
        startscreen.classList.add("hide");
        quiz.classList.remove("hide");
        currentQuestion = 1;
        showQuestion(questions[0]);
    } else {
        const api = `https://opentdb.com/api.php?amount=${num}&category=${cat}&difficulty=${diff}&type=multiple`;
        fetch(api)
            .then(res => res.json())
            .then(data => {
                questions = data.results;
                startscreen.classList.add("hide");
                quiz.classList.remove("hide");
                currentQuestion = 1;
                showQuestion(questions[0]);
            });
    }
};
startBtn.addEventListener("click", startQuiz);
const submitBtn = document.querySelector(".submit"),
    nextBtn = document.querySelector(".next");
const showQuestion = (question) => {
    const questionText = document.querySelector(".question"),
    answersWapper = document.querySelector(".answer-wapper"),
    questionNumber = document.querySelector(".number");
    questionText.innerHTML = question.question;
    const answers = [
        ...question.incorrect_answers,
        question.correct_answer.toString(),
    ];
    answers.sort(() => Math.random()-0.5);
    answersWapper.innerHTML = "";
    answers.forEach((answer) => {
        answersWapper.innerHTML += `
            <div class="answer ">
                <span class="text">${answer}</span>
                <span class="checkbox">
                    <span class="icon">✓</span>
                </span>
            </div>
        `;
    });
    questionNumber.innerHTML = `
        Question <span class="current">${
            questions.indexOf(question) + 1
        }</span><span class="total">/${questions.length}</span>
    `;
    const answersDiv = document.querySelectorAll(".answer");
    answersDiv.forEach((answer) => {
        answer.addEventListener("click", () =>{
            if (!answer.classList.contains("checked")) {
                answersDiv.forEach((answer) => {
                    answer.classList.remove("selected");
                });
                answer.classList.add("selected");
                submitBtn.disabled = false;
            };
        });
    });
    time = timePerQuestion.value;
    startTimer(time)
};
const startTimer = (time) =>{
    timer = setInterval(() =>{
        if (time >= 0) {
            progress(time);
            time--;
        } else {
            checkAnswer();
        }
    }, 1000);
};
submitBtn.addEventListener("click",() => {
    checkAnswer();
});
const checkAnswer = () => {
    clearInterval(timer);
    const selectedAnswer = document.querySelector(".answer.selected");
    const correct = questions[currentQuestion - 1].correct_answer;
    if (selectedAnswer) {
        const answerText = selectedAnswer.querySelector(".text").textContent;
        if (answerText === correct) {
            score++;
            selectedAnswer.classList.add("correct");
        } else {
            selectedAnswer.classList.add("wrong");
            document.querySelectorAll(".answer").forEach((answer) => {
                if (answer.querySelector(".text").textContent === correct) {
                    answer.classList.add("correct");
                }
            });
        }
    } else {
        document.querySelectorAll(".answer").forEach((answer) => {
            if (answer.querySelector(".text").textContent === correct) {
                answer.classList.add("correct");
            }
        });
    }
    document.querySelectorAll(".answer").forEach((answer) => {
        answer.classList.add("checked");
    });
    submitBtn.style.display = "none";
    nextBtn.style.display = "block";
};
nextBtn.addEventListener("click", () =>{
    nextQuestion();
    submitBtn.style.display = "block";
    nextBtn.style.display = "none";
});
const nextQuestion = () =>{
    if (currentQuestion < questions.length) {
        currentQuestion++;
        showQuestion(questions[currentQuestion-1]);
    } else {
        showScore();
    }
}
const endScreen = document.querySelector(".end-screen"),
    finalScore = document.querySelector(".final-score"),
    totalScore = document.querySelector(".total-score");
const showScore = () => {
    endScreen.classList.remove("hide");
    quiz.classList.add("hide");
    finalScore.innerHTML = score;
    totalScore.innerHTML = `/ ${questions.length}`;
}
const restartBtn = document.querySelector(".restart");
restartBtn.addEventListener("click", () =>{
    window.location.reload();
});
