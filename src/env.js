define(function (require) {
  'use strict';

  var p5sound = require('master');

  /**
   *  <p>Envelopes are pre-defined amplitude distribution over time. 
   *  The p5.Env accepts up to four time/level pairs, where time
   *  determines how long of a ramp before value reaches level.
   *  Typically, envelopes are used to control the output volume
   *  of an object, a series of fades referred to as Attack, Decay,
   *  Sustain and Release (ADSR). But p5.Env can control any
   *  Web Audio Param, for example it can be passed to an Oscillator
   *  frequency like osc.freq(env) </p>
   *  
   *  @class p5.Env
   *  @constructor
   *  @param {Number} aTime     Time (in seconds) before level
   *                                 reaches attackLevel
   *  @param {Number} aLevel    Typically an amplitude between
   *                                 0.0 and 1.0
   *  @param {Number} dTime      Time
   *  @param {Number} [dLevel]   Amplitude (In a standard ADSR envelope,
   *                                 decayLevel = sustainLevel)
   *  @param {Number} [sTime]   Time (in seconds)
   *  @param {Number} [sLevel]  Amplitude 0.0 to 1.0
   *  @param {Number} [rTime]   Time (in seconds)
   *  @param {Number} [rLevel]  Amplitude 0.0 to 1.0
   *  @example
   *  <div><code>
   *  var aT = 0.1; // attack time in seconds
   *  var aL = 0.7; // attack level 0.0 to 1.0
   *  var dT = 0.3; // decay time in seconds
   *  var dL = 0.1; // decay level  0.0 to 1.0
   *  var sT = 0.2; // sustain time in seconds
   *  var sL = dL; // sustain level  0.0 to 1.0
   *  var rT = 0.5; // release time in seconds
   *  // release level defaults to zero
   *
   *  var env;
   *  var triOsc;
   *  
   *  function setup() {
   *    env = new p5.Env(aT, aL, dT, dL, sT, sL, rT);
   *    triOsc = new p5.Oscillator('triangle');
   *    triOsc.amp(env); // give the env control of the triOsc's amp
   *    triOsc.start();
   *    env.play();
   *  }
   *  </code></div>
   */
  p5.Env = function(t1, l1, t2, l2, t3, l3, t4, l4){

    /**
     * @property attackTime
     */
    this.aTime = t1;
    /**
     * @property attackLevel
     */
    this.aLevel = l1;
    /**
     * @property decayTime
     */
    this.dTime = t2 || 0;
    /**
     * @property decayLevel
     */
    this.dLevel = l2 || 0;
    /**
     * @property sustainTime
     */
    this.sTime = t3 || 0;
    /**
     * @property sustainLevel
     */
    this.sLevel = l3 || 0;
    /**
     * @property releaseTime
     */
    this.rTime = t4 || 0;
    /**
     * @property releaseLevel
     */
    this.rLevel = l4 || 0;

    this.output = p5sound.audiocontext.createGain();;

    this.control =  new p5.Signal();

    this.control.connect(this.output);

    this.timeoutID = null; // store clearThing timeouts

    this.connection = null; // store connection
  };

  /**
   *  Reset the envelope with a series of time/value pairs.
   *
   *  @method  set
   *  @param {Number} aTime     Time (in seconds) before level
   *                                 reaches attackLevel
   *  @param {Number} aLevel    Typically an amplitude between
   *                                 0.0 and 1.0
   *  @param {Number} dTime      Time
   *  @param {Number} [dLevel]   Amplitude (In a standard ADSR envelope,
   *                                 decayLevel = sustainLevel)
   *  @param {Number} [sTime]   Time (in seconds)
   *  @param {Number} [sLevel]  Amplitude 0.0 to 1.0
   *  @param {Number} [rTime]   Time (in seconds)
   *  @param {Number} [rLevel]  Amplitude 0.0 to 1.0
   */
  p5.Env.prototype.set = function(t1, l1, t2, l2, t3, l3, t4, l4){
    this.aTime = t1;
    this.aLevel = l1;
    this.dTime = t2 || 0;
    this.dLevel = l2 || 0;
    this.sTime = t3 || 0;
    this.sLevel = l3 || 0;
    this.rTime = t4 || 0;
    this.rLevel = l4 || 0;
  };


  /**
   *  
   *  @param  {Object} input       A p5.sound object or
   *                                Web Audio Param
   */
  p5.Env.prototype.setInput = function(unit){
    this.connect(unit);
  };

  /**
   *  Play tells the envelope to start acting on a given input.
   *  If the input is a p5.sound object (i.e. AudioIn, Oscillator,
   *  SoundFile), then Env will control its output volume.
   *  Envelopes can also be used to control any <a href="
   *  http://docs.webplatform.org/wiki/apis/webaudio/AudioParam">
   *  Web Audio Audio Param.</a>
   *
   *  @method  play
   *  @param  {Object} unit        A p5.sound object or
   *                                Web Audio Param
   *  @param  {Number} secondsFromNow time from now (in seconds)
   */
  p5.Env.prototype.play = function(unit, secondsFromNow){
    var now =  p5sound.audiocontext.currentTime;
    var tFromNow = secondsFromNow || 0;
    var t = now + tFromNow;

    if (typeof(this.timeoutID) === 'number') {
      window.clearTimeout(this.timeoutID);
    }

    var currentVal =  this.control.getValue();
    this.control.cancelScheduledValues(t);
    this.control.fade(currentVal);


    if (unit) {
      if (this.connection !== unit) {
        this.connect(unit);
      }
      // if unit is an oscillator, set its amp to 0 and start it
      if (unit instanceof p5.Oscillator){
        if (!unit.started) {
          unit.stop();
          unit.amp(0);
          unit.start();
        }
      }
      var totTime = (t + this.aTime + this.dTime + this.sTime + this.rTime) * 1000;
      this.timeoutID = window.setTimeout( clearThing, totTime );
      // if unit is an oscillator, and volume is 0, stop it to save memory
    }

    // attack
    this.control.linearRampToValueAtTime(this.aLevel, t + this.aTime);
    // decay to decay level
    this.control.linearRampToValueAtTime(this.dLevel, t + this.aTime + this.dTime);
    // hold sustain level
    this.control.linearRampToValueAtTime(this.sLevel, t + this.aTime + this.dTime + this.sTime);
    // release
    this.control.linearRampToValueAtTime(this.rLevel, t + this.aTime + this.dTime + this.sTime + this.rTime);

    function clearThing() {
      if (unit && unit.hasOwnProperty('oscillator') && unit.started){
        unit.amp(0);
        unit.stop();
      }
    }


  };

  /**
   *  Trigger the Attack, Decay, and Sustain of the Envelope.
   *  Similar to holding down a key on a piano, but it will
   *  hold the sustain level until you let go. Input can be
   *  any p5.sound object, or a <a href="
   *  http://docs.webplatform.org/wiki/apis/webaudio/AudioParam">
   *  Web Audio Param</a>.
   *
   *  @method  triggerAttack
   *  @param  {Object} unit p5.sound Object or Web Audio Param
   *  @param  {Number} secondsFromNow time from now (in seconds)
   */
  p5.Env.prototype.triggerAttack = function(unit, secondsFromNow) {


    var now =  p5sound.audiocontext.currentTime;
    var tFromNow = secondsFromNow || 0;
    var t = now + tFromNow;
    this.lastAttack = t;

    if (typeof(this.timeoutID) === 'number') {
      window.clearTimeout(this.timeoutID);
    }

    // var currentVal =  this.control.getValue(); // broken on FireFox
    this.control.cancelScheduledValues(t);
    this.control.setCurrentValueNow();
    this.control.linearRampToValueAtTime(0.0, t);

    if (unit) {
      if (this.connection !== unit) {
        this.connect(unit);
      }

      // if unit is an oscillator, set its amp to 0 and start it
      if (unit instanceof p5.Oscillator){
        if (!unit.started) {
          unit.stop();
          unit.amp(0);
          unit.start();
        }
      }
    }

    this.control.linearRampToValueAtTime(this.aLevel, t + this.aTime);

    // attack
    this.control.linearRampToValueAtTime(this.aLevel, t + this.aTime);
    // decay to sustain level
    this.control.linearRampToValueAtTime(this.dLevel, t + this.aTime + this.dTime);

    // if (this.sLevel > 0) {
      // hold sustain level
    this.control.linearRampToValueAtTime(this.sLevel, t + this.aTime + this.dTime + this.sTime);
    // }
  };

  /**
   *  Trigger the Release of the Envelope. This is similar to releasing
   *  the key on a piano and letting the sound fade according to the
   *  release level and release time.
   *
   *  @method  triggerRelease
   *  @param  {Object} unit p5.sound Object or Web Audio Param
   *  @param  {Number} secondsFromNow time to trigger the release
   */
  p5.Env.prototype.triggerRelease = function(unit, secondsFromNow) {
    var now =  p5sound.audiocontext.currentTime + 0.001;
    var tFromNow = secondsFromNow || 0;
    var t = now + tFromNow;// + envTime;
    var relTime;

    if (unit) {
      if (this.connection !== unit) {
        this.connect(unit);
      }
    }

    this.control.cancelScheduledValues(t);

    // release based on how much time has passed since this.lastAttack
    if ( (now - this.lastAttack) > (this.aTime + this.dTime + this.sTime + this.rTime) ) {
      this.control.setCurrentValueNow();
      this.control.linearRampToValueAtTime(this.sLevel, t + this.sTime);
      this.control.linearRampToValueAtTime(this.rLevel, t + this.sTime + this.rTime);
      relTime = t + this.rTime;
      console.log('2');
    }
    else if ( (now - this.lastAttack) > (this.aTime + this.dTime) ) {
      this.control.setCurrentValueNow();
      this.control.linearRampToValueAtTime(this.dLevel, t + this.dTime);
      this.control.linearRampToValueAtTime(this.sLevel, t + this.dTime + this.sTime);
      this.control.linearRampToValueAtTime(this.rLevel, t + this.dTime + this.sTime + this.rTime);
      console.log('1');
      relTime = t + this.sTime + this.rTime;
    } 
    else if ( (now - this.lastAttack) > (this.aTime) ) {
      this.control.setCurrentValueNow();
      this.control.linearRampToValueAtTime(this.dLevel, t + this.dTime);
      this.control.linearRampToValueAtTime(this.sLevel, t + this.dTime + this.sTime);
      this.control.linearRampToValueAtTime(this.rLevel, t + this.dTime + this.sTime + this.rTime);
      console.log('th0is');
      relTime = t + this.dTime + this.sTime + this.rTime;
    }

    if (unit) {
      var clearTime = relTime * 1000;
      this.timeoutID = window.setTimeout( clearThing, clearTime );
    }

    // if unit is an oscillator, and volume is 0, stop it to save memory
    function clearThing() {
      if (unit.hasOwnProperty('oscillator') && unit.started){
        unit.amp(0);
        unit.stop();
      }
    }
  };

  p5.Env.prototype.connect = function(unit){
    this.disconnect();
    this.connection = unit;

    // assume we're talking about output gain
    // unless given a different audio param
    if (unit instanceof p5.Oscillator ||
        unit instanceof p5.SoundFile ||
        unit instanceof p5.AudioIn ||
        unit instanceof p5.Reverb ||
        unit instanceof p5.Noise ||
        unit instanceof p5.Filter ||
        unit instanceof p5.Delay){
      unit = unit.output.gain;
      // unit.value = 0;
    }
    if (unit instanceof AudioParam){
      //set the initial value
      // unit.value = 0;
      unit.setValueAtTime(0, p5sound.audiocontext.currentTime);
    }
    if (unit instanceof p5.Signal){
      unit.setValue(0);
    }
    this.output.connect(unit);
  };

  p5.Env.prototype.disconnect = function(unit){
    this.output.disconnect();
  };

  // Signal Math

  p5.Env.prototype.add = function(num) {
    var add = new p5.SignalAdd(num);
    add.setInput(this.control);
    return add;
  };

  p5.Env.prototype.mult = function(num) {
    var mult = new p5.SignalMult(num);
    mult.setInput(this.control);
    return mult;
  };

  p5.Env.prototype.scale = function(inMin, inMax, outMin, outMax) {
    var scale = new p5.SignalScale(inMin, inMax, outMin, outMax);
    scale.setInput(this.control);
    return scale;
  };


});