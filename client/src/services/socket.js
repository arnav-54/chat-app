import io from 'socket.io-client';

const socket = io(process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5001');

export default socket;