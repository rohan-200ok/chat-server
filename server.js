// Importing
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const Messages = require('./models/message');
const Rooms = require('./models/room');
const { get } = require('http');


// App Config
const app = express();
const PORT = process.env.PORT || 9000;

// Socket.IO Config
const server = require("http").Server(app);
const io = require("socket.io")(server);

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// DB Config
const connection_url = 'mongodb+srv://rohan_shah:9zQ7CToXomXxS3aN@cluster0.8613q.mongodb.net/chatDB?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

// Socket.IO Channels
io.on("connection", socket => {
    const { id } = socket.client;
    let selectedRoom = "";

    console.log(`User connected: ${id}`);

    socket.on('join room', roomId => {
        
        Rooms.findOne({_id: roomId }, (err,data) => {
            if(err) {
                res.status(500).send(err);
            } else if(data) {
                Messages.find({roomId : roomId}, (err,data) => {
                    if(err) {
                        res.status(500).send(err);
                    } else {
                        
                        if(selectedRoom !== "")
                            socket.leave(selectedRoom)
                        
                        selectedRoom = roomId;
                        socket.join(roomId);
                        socket.emit('joined room',data);
                        // res.status(200).send({data : data});
                    }
                })
            } else {
                // res.status(404).send({ msg : 'Room Not Found!' });
            }
        })
    })

    socket.on("chat message", (newMsg) => {
        var { roomId,text,user } = newMsg;
        Rooms.findById(roomId, (err,data) => {
            if(err) {
                console.log(err)
            } else if(data) {
                Messages.create({
                    roomId: roomId,
                    text: text,
                    user: user
                 }, (err,data) => {
                    if(err) {
                        console.log(err)
                    } else {
                        // res.status(200).send({data : data});
                        io.in(roomId).emit("chat message",data);
                    }
                })
            } else {
                console.log('Room Not Found!')
            }
        })
    });

  });


// API Routes
app.get('/', (req,res) => {
    res.status(200).send('Hello World!');
});

// Get All Rooms
app.get('/rooms/sync', (req,res) => {
    Rooms.find((err,data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({data : data});
        }
    })
});

// Get All rooms based on Role
app.post('/rooms', (req,res) => {
    const user = req.body;
    
    if(user.role === 'buyer') {
        Rooms.find({ buyerId: user.id },(err,data) => {
            if(err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({data : data});
            }
        })
    } else if(user.role === 'seller') {
        Rooms.find({ sellerId: user.id },(err,data) => {
            if(err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({data : data});
            }
        })
    } else if(user.role === 'Admin'){
        Rooms.find((err,data) => {
            if(err) {
                res.status(500).send(err);
            } else {
                res.status(200).send({data : data});
            }
        })
    }
});

// Get Rooms based on Order or Product
app.post('/availablerooms', (req,res) => {
    const { status, sellerId, productId } = req.body;
    
    if(status === 'Orders') {
        Rooms.find({ order: { $ne: null }, sellerId: sellerId },(err,data) => {
            if(err) {
                return res.status(500).send(err);
            } else {
               return res.status(200).send({ rooms: data})
            }
        })
    } else if(status === 'Products') {
        if(productId !== undefined && productId.length > 0) {
            
            Rooms.find({ product: { $ne: null }, sellerId: sellerId, productId : productId },(err,data) => {
                if(err) {
                    return res.status(500).send(err);
                } else {
                    return res.status(200).send({ rooms: data})
                }
            })
        } else {
            
            Rooms.find({ product: { $ne: null }, sellerId: sellerId },(err,data) => {
                if(err) {
                    return res.status(500).send(err);
                } else {
                    return res.status(200).send({ rooms: data})
                }
            })
        }
    }
});

// Join Room or Create new Room
app.post('/room/join', (req,res) => {
    const dbMessage = req.body;

    if(dbMessage.orderId) {
        Rooms.findOne({ orderId: dbMessage.orderId },(err,data) => {
            if(err) {
                res.status(500).send(err);
            } else {
                if(data) {
                    res.status(200).send({room: data});
                } else {
                    Rooms.create(dbMessage, (err,data) => {
                        if(err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).send({room : data});
                        }
                    })
                }
            }
        })
    } else if(dbMessage.productId) {
        Rooms.findOne({ productId: dbMessage.productId },(err,data) => {
            if(err) {
                res.status(500).send(err);
            } else {
                if(data) {
                    res.status(200).send({room: data});
                } else {
                    Rooms.create(dbMessage, (err,data) => {
                        if(err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).send({room : data});
                        }
                    })
                }
            }
        })
    }
});

// Create new Room
app.post('/rooms/new', (req,res) => {
    const dbMessage = req.body;

    Rooms.create(dbMessage, (err,data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(200).send({data : data});
        }
    })
});


// Create new Message
app.post('/rooms/:roomId/messages/new', (req,res) => {
    const dbMessage = req.body;

    Rooms.findOne({_id: req.params.roomId }, (err,data) => {
        if(err) {
            res.status(500).send(err);
        } else if(data) {
            Messages.create({ 
                roomId: data._id,
                text: dbMessage.text,
                user: dbMessage.user
             }, (err,data) => {
                if(err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send({data : data});
                }
            })
        } else {
            res.status(404).send({ msg : 'Room Not Found!' });
        }
    })
});


// Get all the Messages from Room
app.get('/rooms/:roomId/messages', (req,res) => {
    
    Rooms.findOne({_id: req.params.roomId }, (err,data) => {
        if(err) {
            res.status(500).send(err);
        } else if(data) {
            Messages.find({roomId : req.params.roomId}, (err,data) => {
                if(err) {
                    res.status(500).send(err);
                } else {
                    res.status(200).send({data : data});
                }
            })
        } else {
            res.status(404).send({ msg : 'Room Not Found!' });
        }
    })
});

// Listen
server.listen(PORT, () => console.log(`Listen on *: ${PORT}`));
