import { EventEmitter } from 'events';
class MiddlewareEmitter extends EventEmitter {}
const mEmitter = new MiddlewareEmitter();
export default mEmitter
