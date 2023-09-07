const http = require('http')
const express = require('express')
const dotenv = require('dotenv')
const { DataSource } = require('typeorm')
const jwt = require('jsonwebtoken')

dotenv.config()

const myDataSource = new DataSource({
    type : process.env.TYPEORM_CONNETION,
    host : process.env.TYPEORM_HOST,
    port : process.env.TYPEORM_PORT,
    username : process.env.TYPEORM_USERNAME,
    password : process.env.TYPEORM_PASSWORD,
    database : process.env.TYPEORM_DATABASE
})

const app = express()

app.use(express.json())

app.get("/", async(req, res) =>{
    try {
        return res.status(200).json("Welcome!")
    } catch (error) {
        console.log(error)
    }
})

//users 테이블 내용 받아오기
app.get("/users", async(req, res) => {
    try {
        const userData = await myDataSource.query(`
        SELECT id, password, email FROM users
        `)

        console.log("User : ", userData)

        return res.status(201).json({
            "users" : userData
        })
    } catch (error) {
        console.log(error)
    }
})

//user 데이터 넣기
app.post("/users/signup", async(req, res) => {
    try {
        const newUser = req.body;
        
        const { name, email, password} = newUser;

        //값 하나라도 빠진 경우
        if(name === undefined || email === undefined || password === undefined){
            const error = new Error("KEY_ERROR")
            error.statusCode = 400
            error.statusMsg = "KEY_ERROR"
            throw error
        }

        //비번 8자리 미만
        if(password.length < 8){
            const error = new Error("INVALID_PASSWORD")
            error.statusCode = 400
            error.statusMsg = "INVALID_PASSWORD"
            throw error
        }

        //이메일 겹침
        const usedEmail = await myDataSource.query(`
        SELECT id, email FROM users WHERE email = '${email}'
        `)

        console.log("already email : ", usedEmail)
        if(usedEmail.length != 0){
            const error = new Error("DUPLICATED_EMIAL_ADDRESS")
            error.statusCode = 400
            error.statusMsg = "DUPLICATED_EMIAL_ADDRESS"
            throw error
        }

        const userData = await myDataSource.query(`
        INSERT INTO users (
            name,
            password,
            email)
            VALUES (
                '${name}',
                '${password}',
                '${email}'
            )
        `)

        console.log("new User : ", userData)

        return res.status(201).json({
            "message" : "userCreated"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            "error" : error
        })
    }
})

//로그인
app.post("/users/login", async(req, res) =>{
    try {
        const email = req.body.email;
        const password = req.body.password;
    
        //이메일 있나 확인
        const userEmail = await myDataSource.query( `
        SELECT id, email FROM users WHERE email = '${email}'
        `)

        if(email === undefined || password === undefined){
            const error = new Error("KEY_ERROR")
            error.statusCode = 400
            error.status = "KEY_ERROR"
            throw error
        }

        if(userEmail.length === 0){
            const error = new Error("UNDIFIEND_USER")
            error.statusCode = 400
            error.status = "UNDIFIEND_USER"
            throw error
        }

        const userPassword = await myDataSource.query(`
        SELECT id, email, password FROM users WHERE password = '${password}'
        `)

        if(userPassword.length === 0){
            const error = new Error("WRONG_PASSWORD")
            error.statusCode = 400
            error.status = "WRONG_PASSWORD"
            throw error
        }

        return res.status(201).json({
            "message" : "LOGIN_SUCESS"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            "error" : error
        })
    }

})


const server = http.createServer(app)

const start = async() => {
    try {
        server.listen(8000, () => console.log(`Server is listening on 8000`))
    } catch (error) {
        console.log(error)
    }
}

myDataSource.initialize()
.then(() =>{
    console.log("Data Source has been initialized!")
})

start()