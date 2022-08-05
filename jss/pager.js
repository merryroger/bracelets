/**
 * The Object Pager JavaScript library
 * version 0.1.0
 * © 2022 Ehwaz Raido
 * 05/Aug/2022
 */

const Pager = class ObjectPager {

  _settings = {
    frameDock: null,
    band: null,
    ctrlDock: null,
    items: [],
    rightEdge: 15,
    append: () => { return {} },
    keydown: (e) => { },
  }

  _parameters = {
    itemRect: {},
    frameRect: {},
    bandRect: null,
    gap: 0,
    moveLength: 1,
    itemsPerScreen: 1,
    movesNeeded: 0,
  }

  constructor(settings = {}) {
    this._toh = 0;
    this._move = this._doMove.bind(this);
    this._resized = this._reSized.bind(this);
    this._recalc = this._reCalcSizes.bind(this);
    this._setUp(settings);
    this._keydown = this._settings.keydown.bind(this, [this._move]);
    this._hangListeners();
    this._reCalcSizes();
  }

  _setUp(data) {
    for (let [key, val] of Object.entries(data)) {
      this._settings[key] = val;
    }
  }

  _reCalcSizes() {
    this._resetBand();
    const itemRect = this._settings.items[0].getBoundingClientRect();
    const frameRect = this._parameters.frameRect = this._settings.frameDock.getBoundingClientRect();
    const bandRect = this._parameters.bandRect = this._settings.band.getBoundingClientRect();
    const rows = Math.floor(bandRect.height / itemRect.height);
    const rowMaxCapacity = Math.ceil(this._settings.items.length / rows);
    const gap = this._parameters.gap = Math.floor((bandRect.width - itemRect.width * rowMaxCapacity) / (rowMaxCapacity - 1));
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
      ctrl.control.addEventListener('pointerdown', this._move);
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
      elem.querySelector('input').removeEventListener('pointerdown', this._move);
      elem = null;
    });

    return controls;
  }

  _doMove(e) {
    const treck = this._parameters.moveLength * this._parameters.itemsPerScreen;
    let dX = -1 * (e.target.value - 1) * treck;
    dX = (dX + this._parameters.bandRect.right + this._settings.rightEdge < this._parameters.frameRect.right) ?
      this._parameters.frameRect.right - this._parameters.bandRect.right - this._settings.rightEdge :
      dX;
    this._settings.band.style.setProperty('transform', `translateX(${dX}px)`);
  }

  _hangListeners() {
    const controls = Array.from(this._settings.ctrlDock.querySelectorAll('label'));
    controls.forEach((control) => {
      control.querySelector('input').addEventListener('pointerdown', this._move);
      control.addEventListener('keydown', this._keydown);
    })

    window.addEventListener('resize', this._resized);
  }

  _resetBand() {
    const input = this._settings.ctrlDock.querySelectorAll('input')[0];
    input.checked = true;
    this._settings.band.style.setProperty('transform', `translateX(0)`);
  }

  _reSized() {
    this._settings.band.style.setProperty('transform', `translateX(0)`);

    if (this._toh !== 0) {
      clearTimeout(this._toh);
      this._toh = 0;
    }

    this._toh = setTimeout(this._recalc, 500);
  }

}

export default Pager;
