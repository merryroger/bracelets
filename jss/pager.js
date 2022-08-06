/**
 * The Object Pager JavaScript library
 * version 0.1.1
 * © 2022 Ehwaz Raido
 * 05/Aug/2022 .. 06/Aug/2022
 */

const Pager = class ObjectPager {

  _settings = {
    frameDock: null,
    band: null,
    ctrlDock: null,
    items: [],
    swipSpotLr: null,
    rightEdge: 15,
    append: () => { return {} },
    keydown: (e) => { },
  }

  _parameters = {
    ctrlDockWidth: 0,
    itemRect: {},
    frameRect: {},
    bandRect: null,
    gap: 0,
    moveLength: 1,
    itemsPerScreen: 1,
    movesNeeded: 0,
    shift: 0,
  }

  constructor(settings = {}) {
    this._toh = 0;
    this._swipping = false;
    this._swiX = 0;
    this._swiY = 0;
    this._setUp(settings);
    this._move = this._doMove.bind(this);
    this._resized = this._reSized.bind(this);
    this._recalc = this._reCalcAfterResize.bind(this);
    this._keydown = this._settings.keydown.bind(this, [this._move]);
//    this._ptrdn = this._pointerDown.bind(this);
//    this._ptrmv = this._pointerMove.bind(this);
//    this._ptrup = this._pointerUp.bind(this);
//    this._cardclk = this._cardClick.bind(this);
    this._hangListeners();
    this._resetBand();
    this._reCalcSizes();
  }

  _setUp(data) {
    for (let [key, val] of Object.entries(data)) {
      this._settings[key] = val;
    }
  }

  _reCalcSizes() {
    this._parameters.ctrlDockWidth = this._settings.ctrlDock.offsetWidth;
    const itemRect = this._settings.items[0].getBoundingClientRect();
    const frameRect = this._parameters.frameRect = this._settings.frameDock.getBoundingClientRect();
    const bandRect = this._parameters.bandRect = this._settings.band.getBoundingClientRect();
    let rows = Math.floor(bandRect.height / itemRect.height);
    rows = (rows == 0) ? 1 : rows;
    const rowMaxCapacity = Math.ceil(this._settings.items.length / rows);
    const gap = (rowMaxCapacity < 2) ? 0 : this._parameters.gap = Math.floor((bandRect.width - itemRect.width * rowMaxCapacity) / (rowMaxCapacity - 1));
    const moveLength = this._parameters.moveLength = itemRect.width + gap;
    const itemsPerScreen = this._parameters.itemsPerScreen = Math.floor((frameRect.width + gap) / moveLength);
    const movesNeeded = this._parameters.movesNeeded = Math.ceil(rowMaxCapacity / itemsPerScreen);
    this._rebuildControls(movesNeeded);
    this._toh = 0;
  }

  _rebuildControls(cnt) {
    const controls = Array.from(this._settings.ctrlDock.querySelectorAll('label'));
    let ctrlSet = [];
    if (cnt == controls.length) {
      return;
    } else if (cnt > controls.length) {
      ctrlSet = this._appendControls(controls, cnt);
    } else {
      ctrlSet = this._reduceControls(controls, cnt);
      this._settings.ctrlDock.innerHTML = '';
    }

    this._settings.ctrlDock.append(...ctrlSet);
  }

  _appendControls(controls, upTo) {
    const newCtrls = [];
    for (let i = controls.length; i < upTo; i++) {
      let ctrl = this._settings.append(i + 1);
      ctrl.control.addEventListener('change', this._move);
      ctrl.container.addEventListener('keydown', this._keydown);
      ctrl.container.append(ctrl.control);
      newCtrls.push(ctrl.container);
    }

    return newCtrls;
  }

  _reduceControls(controls, downTo) {
    const trash = controls.splice(downTo);
    trash.forEach((elem) => {
      elem.removeEventListener('keydown', this._keydown);
      elem.querySelector('input').removeEventListener('change', this._move);
      elem = null;
    });

    return controls;
  }

  _doMove(e) {
    const treck = this._parameters.moveLength * this._parameters.itemsPerScreen;
    let dX = -1 * (e.target.value - 1) * treck;
    dX = (dX + this._parameters.bandRect.right + this._settings.rightEdge - this._parameters.shift < this._parameters.frameRect.right) ?
      this._parameters.frameRect.right - this._parameters.bandRect.right - this._settings.rightEdge + this._parameters.shift :
      dX;
    this._settings.band.style.setProperty('transform', `translateX(${dX}px)`);
  }

  _hangListeners() {
    const controls = Array.from(this._settings.ctrlDock.querySelectorAll('label'));
    controls.forEach((control) => {
      control.querySelector('input').addEventListener('change', this._move);
      control.addEventListener('keydown', this._keydown);
    })

//    this._settings.band.addEventListener('pointerdown', this._ptrdn);
//    document.body.addEventListener('pointermove', this._ptrmv);
//    document.body.addEventListener('pointerup', this._ptrup);
//    this._settings.band.addEventListener('click', this._cardclk);
    window.addEventListener('resize', this._resized);
  }

  _resetBand() {
    const input = this._settings.ctrlDock.querySelectorAll('input')[0];
    input.checked = true;
    this._settings.band.style.setProperty('transform', `translateX(0)`);
  }

  _getCardAtLeftPosition(cv) {
    return (cv == 1) ? 1 :
      (cv == this._parameters.movesNeeded) ? this._settings.items.length :
        (cv - 1) * this._parameters.itemsPerScreen + 1;
  }

  _getFocusedCardNum() {
    let cardNum = 0;
    const focused = document.querySelector(":focus");
    this._settings.items.forEach((item, index) => {
      if (item === focused) {
        cardNum = index + 1;
      }
    });

    return cardNum;
  }

  _getCurrentPageValue() {
    const pn = this._settings.ctrlDock['review-page'].value;
    const input = this._settings.ctrlDock.querySelectorAll('input')[pn - 1];
    input.closest('label').blur();

    return pn;
  }
  _reCalcAfterResize() {
    if (this._parameters.ctrlDockWidth != this._settings.ctrlDock.offsetWidth) {
      let cv = this._getCurrentPageValue();
      let atLeftEdge = this._getCardAtLeftPosition(cv);
      const focusedCard = this._getFocusedCardNum();
      this._parameters.shift = +getComputedStyle(this._settings.band).transform.split(', ')[4];

      this._reCalcSizes();

      atLeftEdge = (focusedCard && (focusedCard - atLeftEdge) >= this._parameters.itemsPerScreen) ? focusedCard : atLeftEdge;
      cv = Math.floor((atLeftEdge - 1) / this._parameters.itemsPerScreen);
      const input = this._settings.ctrlDock.querySelectorAll('input')[cv];
      input.checked = true;
      this._doMove({ target: input });
    }
  }

  _reSized() {
    if (this._toh !== 0) {
      clearTimeout(this._toh);
      this._toh = 0;
    }

    this._toh = setTimeout(this._recalc, 300);
  }
/*
  _pointerDown(e) {
    if (e.target.closest('#review-model-band') !== null) {
      e.preventDefault();
      this._swipping = true;
      this._swiX = e.clientX - +getComputedStyle(this._settings.band).transform.split(', ')[4];
      this._settings.band.style.setProperty('transition', 'transform 0s linear');
      //e.stopImmediatePropagation();
    }
  }

  _pointerMove(e) {
    if (this._swipping) {
      const dX = e.clientX - this._swiX;
      this._settings.band.style.setProperty('transform', `translateX(${dX}px)`);
    }
  }

  _pointerUp(e) {
    if (this._swipping) {
      e.preventDefault();
      this._settings.band.style.setProperty('transition', 'transform .5s ease-in-out');
      this._parameters.shift = +getComputedStyle(this._settings.band).transform.split(', ')[4];
      this._swipping = false;
    }
  }

  _cardClick(e) {
    //if (this._swipping) {
      //e.preventDefault();
      //e.stopImmediatePropagation();
      //return false;
    //}
  }
*/
}

export default Pager;
