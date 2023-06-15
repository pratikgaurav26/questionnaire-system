const express = require('express')
const morgan = require('morgan')
const createError = require('http-errors')
require('dotenv').config()
require('./helpers/init_mongodb')
const { verifyAccessToken } = require('./helpers/jwt_helper')
require('./helpers/init_redis')

const AuthRoute = require('./Routes/Auth.route')

const app = express()
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', verifyAccessToken, async (req, res, next) => {
  res.send('Hello from express.')
})

app.use('/auth', AuthRoute)

app.use(async (req, res, next) => {
  next(createError.NotFound())
})

app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  })
})

app.post("/submit-test", async (req, res) => {
  try {
    const { userId, testId, responses } = req.body;

    const testResult = await db
      .collection("results")
      .findOne({ userId, testId });
    if (testResult) {
      return res.status(400).json({ error: "User has already taken the test" });
    }

    const test = await db
      .collection("tests")
      .findOne({ _id: ObjectId(testId) });
    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    let score = 0;
    for (const response of responses) {
      const question = test.questions.find(
        (q) => q._id.toString() === response.questionId
      );
      if (!question) {
        continue;
      }

      const correctAnswers = question.correctAnswers.sort();
      const userAnswers = response.answers.sort();

      if (
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((a, i) => a === userAnswers[i])
      ) {
        score++;
      }
    }

    await db.collection("results").insertOne({ userId, testId, responses });

    res.json({ userId, testId, score });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.close();
  }
});

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
