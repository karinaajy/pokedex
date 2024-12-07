'use strict';
(function() {

  //const NUMBER_API_URL = 'pokedex.php?pokedex=all';
  const IMG_PATH = 'https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/';
  const POKEDEX_PHP = 'https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php';
  const GAME_PHP = 'https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php';
  const ABS_PATH = 'https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/';
  const DEFAULT_STARTER = ['bulbasaur', 'charmander', 'squirtle'];
  let shortName = '';
  let HP;
  let guid;
  let pid;
  window.addEventListener('load', init());

  /**
   * create the main view of the game
   */
  function init() {
    mainView();
  }

  /**
   * make the fetch request in the function
   * If at any time there is an error, the
   * execution falls down to the .catch method on the
   * Promise chain
   */
  function mainView() {
    let name = '?pokedex=all';
    fetch(POKEDEX_PHP + name)
      .then(statusCheck)
      .then(res => res.text())
      .then(populateBoard)
      .catch(console.error);
  }

  /**
   * generate the board of the pokemo. User can click the
   * pokemo with color
   * @param {Promise} data return the value of the Promise
   */
  function populateBoard(data) {
    let pokedexView = id('pokedex-view');
    data = data.trim().split("\n");
    for (let i = 0; i < data.length; i++) {
      let shortname = data[i].split(":");
      let newImg = gen('img');
      newImg.id = shortname[1];
      newImg.src = ABS_PATH + shortname[1] + '.png';
      newImg.alt = 'uncollect Pokemon - ' + shortname;
      newImg.classList.add('sprite');
      if (DEFAULT_STARTER.includes(shortname[1])) {
        newImg.classList.add('found');
        newImg.alt = 'collect Pokemon - ' + shortname;
        newImg.addEventListener('click', viewCard);
      }
      pokedexView.appendChild(newImg);
    }
  }

  /**
   * make a fetch request for the clicked pokemo.
   */
  function viewCard() {
    shortName = this.id;
    let parameter = '?pokemon=';
    fetch(POKEDEX_PHP + parameter + shortName)
      .then(statusCheck)
      .then(res => res.json())
      .then(function(data) {
        genCard(data, "#p1");
        return data;
      })
      .then(startButton)
      .catch(console.error);
  }

  /**
   * generate the card of pokemo including its type, move,
   * skill and hp, dp.
   * @param {Promise} data return the value of the Promise
   * @param {String} p1 the number of which card to update
   */
  function genCard(data, p1) {
    qs(p1 + ' .name').textContent = data.name;
    let cardImg = qs(p1 + ' .pokepic');
    cardImg.src = IMG_PATH + data.images.photo;
    cardImg.alt = "Pokemon's photo";
    let typeIcon = qs(p1 + ' .type');
    typeIcon.src = IMG_PATH +  data.images.typeIcon;
    typeIcon.alt = 'type icon of the Pokemon';
    let weaknessIcon = qs(p1 + ' .weakness');
    weaknessIcon.src = IMG_PATH + data.images.weaknessIcon;
    weaknessIcon.alt = 'weakness type icon of the Pokemon';
    qs(p1 + ' .hp').textContent = data.hp + "HP";
    qs(p1 + ' .info').textContent = data.info.description;
    let moveName = qsa(p1 + ' .moves .move');
    let moveImg = qsa(p1 + ' .moves img');

    for (let i = 0; i < data.moves.length; i++) {
      moveName[i].textContent = data.moves[i].name;
      moveImg[i].src = IMG_PATH + 'icons/' + data.moves[i].type + '.jpg';
      if (data.moves[i].dp !== undefined) {
        qsa(p1 + ' .dp')[i].textContent = data.moves[i].dp + "DP";
      } else {
        qsa(p1 + ' .dp')[i].textContent = "";
      }
    }

      for (let i = 0; i < 4 - data.moves.length; i++) {
        qsa(p1 + ' .moves button')[i + data.moves.length].classList.add('hidden');
      }

  }

  /**
   * update startbutton to start a game
   * @param {Promise} data return the value of the Promise
   */
  function startButton(data) {
    let startBtn = id('start-btn');
    startBtn.classList.remove('hidden');
    startBtn.addEventListener('click', gameView)
  }

  /**
   * start the game view.
   */
  function gameView() {
    let data = new FormData();
    data.append("startgame", true);
    data.append("mypokemon", shortName);
    fetch(GAME_PHP, {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(function(res) {
        initGameData(res);
      })
      .catch(console.error);

    id('pokedex-view').classList.add('hidden');
    id('p2').classList.remove('hidden');
    qs('.hp-info').classList.remove('hidden');
    id('results-container').classList.remove('hidden');
    id('flee-btn').classList.remove('hidden');
    id('start-btn').classList.add('hidden');
    qs("header h1").textContent = "Pokemon Battle!";

    let movebtn = qs('#p1 .moves');
    for (let i = 0; i < movebtn.children.length; i++) {
      movebtn.children[i].disabled = false;
      movebtn.children[i].addEventListener("click", playMove);
    }
  }

  /**
   * update the second game
   * @param {Promise} res return the value of the Promise
   */
  function initGameData(res) {
    HP = res.p1.hp;
    guid = res.guid;
    pid = res.pid;
    genCard(res.p2, "#p2");
  }


  function playMove() {
    id('loading').classList.remove('hidden');
    let data = new FormData();
    data.append("guid", guid);
    data.append("pid", pid);
    let dataMove = this.firstElementChild;
    if (dataMove !== null) {
      dataMove = dataMove.textContent.split(' ').join('');
    } else {
      dataMove = 'flee';
    }
    dataMove = dataMove.toLowerCase();
    data.append("movename", dataMove);
    fetch(GAME_PHP, {method: "POST", body: data})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(moveResult)
      .catch(console.error);
  }

  function moveRequest(data, p1) {
    let move = data.results[p1 + '-move'];
    let result = data.results[p1 + '-result'];
    id(p1 + '-turn-results').textContent = 'Player 1 played' + move + ' and ' +
    result + '!';
    id(p1 + '-turn-results').classList.remove('hidden');
    let currentHp = data.p1['current-hp'];
    qs('#' + p1 + ' .hp').textContent = currentHp + 'HP';
    let percentHP = currentHp / HP * 100;
    if (percentHP < 20) {
      qs('#' + p1 + ' .health-bar').classList.add('low-health');
    }
    qs('#' + p1 + ' .health-bar').style.width = percentHP + '%';
  }

  /**
   * decide who win the game and update the game status
   * @param {Promise} data return the value of the Promise
   */
  function moveResult(data) {
    id('loading').classList.add('hidden');
    id('results-container').classList.remove('hidden');
    let HP1 = data.p1['current-hp'];
    let HP2 = data.p2['current-hp'];
    if (HP1 === 0) {
      qs('h1').textContent = 'You lost!';
      id('endgame').classList.remove('hidden');
      id('endgame').addEventListener('click', endGame);
      id('flee-btn').classList.add('hidden');
      for (let i = 0; i < 4; i++) {
        qsa('#p1 .moves button')[i].disabled = true;
      }
    } else if (HP2 === 0){
      qs('h1').textContent = 'You won!';
      id('endgame').classList.remove('hidden');
      id('endgame').addEventListener('click', endGame);
      id('flee-btn').classList.add('hidden');
      for (let i = 0; i < 4; i++) {
        qsa('#p1 .moves button')[i].disabled = true;
      }
      id(shortName).classList.add("found");
      id(shortName).alt = shortName;
      id(shortName).addEventListener("click", viewCard);
    } else if (data.results['p1-move'] === 'flee') {
      qs('h1').textContent = 'You lost!';
      id('endgame').addEventListener('click', endGame);
      id('flee-btn').classList.add('hidden');
      for (let i = 0; i < 4; i++) {
        qsa('#p1 .moves button')[i].disabled = true;
      }
    } else {
      moveRequest(data, 'p1');
      moveRequest(data, 'p2');
    }
  }


  /**
   * back to the main game if the game end
   */
  function endGame() {
    id('endgame').classList.add('hidden');
    id('results-container').classList.add('hidden');
    id("p2").classList.add("hidden");
    id("start-btn").classList.remove("hidden");
    qs("header h1").textContent = "Your Pokedex";
    id("pokedex-view").classList.remove("hidden");
    id("p1-turn-results").textContent = "";
    id("p2-turn-results").textContent = "";
    qs("#p1 .hp").textContent = HP + "HP";
    qs('#p1 .health-bar').style.width = '100%';
    qs('#p2 .health-bar').style.width = '100%';
    qs("#p1 .health-bar").classList.remove("low-health");
  }

  /**
   * checks the status of the response to makes sure the
   * generate the header and ability and append
   * server responded with an OK
   * them in to the section
   * @param {Promise} res return the Promise
   * object with a JavaScript object as the value
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * document.getElementById(id) method
   * @param {element} id select id
   * @return {element} returns an Element object representing the
   * element whose id property matches the specified string
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * document.querySelector(selector) method
   * @param {element} selector select element
   * @return {element} returns the first Element within the document
   * that matches the specified selector, or group of selectors
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * document.querySelectorAll(selector) method
   * @param {element} selector select element
   * @return {NodeList} a list of the document's elements that match the
   * specified group of selectors.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }


  /**
   * generate element
   * @param {element} tag select element
   * @return {element} returns the generate element
   */
  function gen(tag) {
    return document.createElement(tag);
  }
})();