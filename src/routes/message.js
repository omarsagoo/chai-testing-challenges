const express = require('express')
const router = express.Router();

const User = require('../models/user')
const Message = require('../models/message');
const { update } = require('../models/user');

/** Route to get all messages. */
router.get('/', (req, res) => {
    Message.find().then(messages => {
        return res.json(messages)
    }).catch(err => {
        throw err.message
    })
})

/** Route to get one message by id. */
router.get('/:messageId', (req, res) => {
    // Get the Message object with id matching `req.params.id`
    // using `findOne`
    Message.findById(req.params.messageId).then(message => {
        return res.json(message)
    }).catch(err => {
        throw err.message
    })
})

/** Route to add a new message. */
router.post('/', (req, res) => {
    let message = new Message(req.body)
    message.save()
    .then(message => {
        return User.findById(message.author)
    })
    .then(user => {
        // console.log(user)
        user.messages.unshift(message)
        return user.save()
    })
    .then(() => {
        return res.send(message)
    }).catch(err => {
        throw err.message
    })
})

/** Route to update an existing message. */
router.put('/:messageId', (req, res) => {
    // Update the matching message using `findByIdAndUpdate`
    Message.findByIdAndUpdate(req.params.messageId, req.body).then(() => {
        return Message.findById(req.params.messageId)
    }).then(message => {
        return res.json({message})
    }).catch(err => {
        throw err.message
    })
})

/** Route to delete a message. */
router.delete('/:messageId', (req, res) => {
    // Delete the specified Message using `findByIdAndDelete`. Make sure
    // to also delete the message from the User object's `messages` array
    Message.findByIdAndDelete(req.params.messageId).then((deletedMessage) => {
        return User.findById(deletedMessage.author)
    }).then(user => {
        index = user.messages.indexOf(deletedMessage)
        user.messages.splice(index, 1)

        return res.json("Message has been deleted")
    }).catch(err => {
        throw err.message
    })
})

module.exports = router