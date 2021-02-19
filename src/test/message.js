require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

const SAMPLE_USER_OBJECT_ID = 'cccccccccccc' // 12 byte string
const SAMPLE_MESSAGE_OBJECT_ID = 'eeeeeeeeeeee' // 12 byte string


describe('Message API endpoints', () => {
    // create a sample message for tests
    beforeEach((done) => {
        const sampleUser = new User({
            username: 'myuser',
            password: 'mypassword',
            _id: SAMPLE_USER_OBJECT_ID
        })
        const sampleMessage = new Message({
            title: "test message",
            body: "test body",
            _id: SAMPLE_MESSAGE_OBJECT_ID
        })
        sampleUser.save()
        .then(() => {
            sampleMessage.author = sampleUser
            return sampleMessage.save()
        }).then(() => {
            sampleUser.messages.unshift(sampleMessage)
            sampleUser.save()
            done()
        })
    })

    afterEach((done) => {
        Message.deleteMany({
            title: ["test message", "another message"]
        }).then(() => {
            return User.deleteMany({
                username: ["myuser"]
            })
        }).then(() => {
            done()
        })
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages')
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body.messages).to.be.an("array")
            done()
        })
    })

    it('should get one specific message', (done) => {
        chai.request(app)
        .get(`/messages/${SAMPLE_MESSAGE_OBJECT_ID}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body.body).to.equal('test body')
            expect(res.body.title).to.equal('test message')
            done()
        })
    })

    it('should post a new message', (done) => {
        User.find().then(users => {
            return users[0]
        }).then(user => {
            chai.request(app)
            .post('/messages')
            .send({title: 'another message', body: 'another body', author: user}).end((err, res) => {
                if (err) { done(err) }
                expect(res.body).to.be.an('object')
                expect(res.body).to.have.property('title', 'another message')

                Message.findOne({title: "another message"}).then(message => {
                    expect(message).to.be.an("object")
                    done()
                })
            })
        })
    })

    it('should update a message', (done) => {
        chai.request(app)
        .put(`/messages/${SAMPLE_MESSAGE_OBJECT_ID}`)
        .send({title: 'another message'})
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.be.an('object')
            expect(res.body.message).to.have.property('title', 'another message')

            // check that message is actually inserted into database
            Message.findOne({title: 'another message'}).then(message => {
                expect(message).to.be.an('object')
                done()
            })
        })
    })

    it('should delete a message', (done) => {
        chai.request(app)
        .delete(`/messages/${SAMPLE_MESSAGE_OBJECT_ID}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.equal("Message has been deleted")
            expect(res.body._id).to.equal(SAMPLE_MESSAGE_OBJECT_ID)

            // check that message is actually deleted from database
            Message.findOne({title: 'test message'}).then(message => {
                expect(message).to.equal(null)
                // check that the message was deleted from the users list of messages
                return User.findById(SAMPLE_USER_OBJECT_ID)
            }).then(user =>{
                expect(user.messages).to.be.an('array')
                expect(user.messages).to.have.length(0)
                done()
            })
        })
    })
})
