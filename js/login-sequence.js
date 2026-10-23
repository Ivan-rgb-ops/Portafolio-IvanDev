// Presentation state machine. Never reads, requests or validates a real credential.
export class LoginSequence {
  constructor(onChange,{schedule=(callback,delay)=>setTimeout(callback,delay),cancel=id=>clearTimeout(id),reducedMotion=()=>false}={}) {
    this.onChange=onChange;this.schedule=schedule;this.cancel=cancel;this.reducedMotion=reducedMotion;this.timers=[];this.state='desktop';this.count=0;
  }
  clear() {this.timers.forEach(id=>this.cancel(id));this.timers=[];}
  emit(state,count=0) {this.state=state;this.count=count;this.onChange({state,count});}
  later(callback,delay) {this.timers.push(this.schedule(callback,delay));}
  lock() {this.clear();this.emit('lock');}
  begin() {
    if(this.state!=='lock')return;
    this.clear();this.emit('typing');
    if(this.reducedMotion()){this.finish();return;}
    // Same four-character presentation as the original portfolio, styled as Windows.
    for(let i=1;i<=4;i++)this.later(()=>this.emit('typing',i),280+i*180);
    this.later(()=>this.welcome(),1250);
  }
  welcome() {
    if(!['typing','welcome'].includes(this.state))return;
    this.clear();this.emit('welcome',4);this.later(()=>this.finish(),this.reducedMotion()?0:750);
  }
  finish() {this.clear();this.emit('desktop');}
  powerOff() {this.clear();this.emit('off');}
}
