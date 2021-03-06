import Vue from 'vue'
import Vuex from 'vuex'

import { prepareDeck } from '@/utils/game'

Vue.use(Vuex)

const initialState = {
	gamePoints: 5,
	status: 'playing',
	deck: [],
	playerCards: [],
	dealerCards: [],
	commonCards: [],
	selectedCards: [],
	playerCardsWinned: [],
	dealerCardsWinned: [],
	turn: 'player',
	deal: 0,
	restart: false,
	round: 1,
	results: {
		player: [0],
		dealer: [0]
	},
	device: null
}

export default new Vuex.Store({
	state: JSON.parse(JSON.stringify(initialState)),

	mutations: {
		resize (state, device) {
			state.device = device
		},
		broom (state, player) {
			const playerResults = state.results[player]
			playerResults[playerResults.length - 1]++
		},
		clearStateToNewGame (state, points) {
			state.gamePoints = points || state.gamePoints
			state.restart = true
			state.playerCards = []
			state.dealerCards = []
			state.commonCards = []
			state.selectedCards = []
			state.playerCardsWinned = []
			state.dealerCardsWinned = []
			state.turn = 'player'
			state.status = 'playing'
			state.deal = 0
			state.round = 1
			state.results = {
				player: [0],
				dealer: [0]
			}
		},

		setTurn (state, turn) {
			state.turn = turn
		},

		clearStateToNextRound (state) {
			state.restart = true
			state.playerCards = []
			state.dealerCards = []
			state.commonCards = []
			state.selectedCards = []
			state.playerCardsWinned = []
			state.dealerCardsWinned = []
			state.status = 'playing'
			state.deal = 0
			state.round++
			state.results.player.push(0)
			state.results.dealer.push(0)
		},

		cardsToDeck (state) {
			const allCardsInDeck = state.deck.map(c => {
				c.position = 'deck'
				c.positionIndex = 0
				c.facedDown = true
				return c
			})
			state.deck = allCardsInDeck
		},

		setNewDeck (state, deck) {
			state.deck = deck
		},

		deal (state, player) {
			const hands = {
				player: state.playerCards,
				dealer: state.dealerCards
			}
			let firstCardOfDeck = state.deck.find(card => card.dealed === false)
			if (player === 'commonCard') {
				firstCardOfDeck.facedDown = false
				firstCardOfDeck.player = 'common'
				firstCardOfDeck.position = 'common'
				firstCardOfDeck.positionIndex = state.commonCards.length
				firstCardOfDeck.dealed = true
				state.commonCards.push(firstCardOfDeck)
				return
			}
			if (player === 'player') {
				firstCardOfDeck.facedDown = false
			}
			firstCardOfDeck.player = player
			firstCardOfDeck.position = player
			firstCardOfDeck.positionIndex = hands[player].length
			firstCardOfDeck.dealed = true
			hands[player].push(firstCardOfDeck)
			state.restart = false
		},

		dealerSelectedCards (state, cards) {
			state.selectedCards = cards
			const dealerSelectedCard = cards.filter(card => card.player === 'dealer')[0]
			const dealerCards = state.dealerCards
			const commonSelectedCard = cards.filter(card => card.player === 'common')
			const commonCards = state.commonCards
			dealerCards.forEach((el, i) => {
				if (el.suit === dealerSelectedCard.suit && el.value === dealerSelectedCard.value) {
					dealerCards[i].selected = true
					dealerCards[i].facedDown = false
				}
			})
			commonSelectedCard.forEach((selectCard, i) => {
				commonCards.forEach((commonCard, j) => {
					if (selectCard.suit === commonCard.suit && selectCard.value === commonCard.value) {
						commonCards[j].selected = true
					}
				})
			})
		},

		selectCard (state, card) {
			if (card.player !== 'common' && card.player !== state.turn) return
			if (state.deck.find(deckCard => card.player !== 'common' && deckCard.selected && deckCard.player === card.player)) return
			const { index } = card
			if (card.player === 'dealer') {
				state.deck[39 - index].facedDown = false
			}
			state.selectedCards.push(card)
			state.deck[39 - index].selected = true
		},

		deselectCard (state, card) {
			const { index } = card
			state.deck[39 - index].selected = false
			state.selectedCards.some((selectedCard, i) => {
				if (selectedCard === card) {
					state.selectedCards.splice(i, 1)
				}
			})
		},

		removePlayedCard (state, card) {
			const { player, index } = card
			const cardsOnWinnedDeck = state.deck.filter(c => c.position === `${state.turn}Deck`)
			state.deck[39 - index].position = `${state.turn}Deck`
			state.deck[39 - index].facedDown = true
			state.deck[39 - index].selected = false
			state.deck[39 - index].positionIndex = cardsOnWinnedDeck.length
			const players = {
				dealer: state.dealerCards,
				player: state.playerCards,
				common: state.commonCards
			}
			players[player].forEach((playerCard, i) => {
				if (playerCard === card) {
					players[player].splice(i, 1)
				}
			})
			players[player].filter(c => c.player === 'common').forEach((playerCard, i) => {
				players[player][i].positionIndex = i
			})
		},

		resetSelectedCards (state) {
			state.selectedCards = []
			state.deck = state.deck.map(c => {
				c.selected = false
				return c
			})
		},

		changeTurn (state) {
			const turns = {
				'player': 'dealer',
				'dealer': 'player'
			}
			state.turn = turns[state.turn]
			if (state.deal === 6 && !state.dealerCards.length && !state.playerCards.length) {
				state.status = 'finished'
			}
		},

		setCardToCommonCards (state, {player, card}) {
			const hands = {
				player: state.playerCards,
				dealer: state.dealerCards
			}
			const newPlayerHand = hands[player].filter((handCard, i) => {
				if (handCard === card) {
					hands[player].splice(i, 1)
				}
				return handCard !== card
			})
			state.deck.forEach((deckCard, i) => {
				if (deckCard === card) {
					state.deck[i].facedDown = false
					state.deck[i].position = 'common'
					state.deck[i].positionIndex = state.commonCards.length
					state.deck[i].player = 'common'
				}
			})
			hands[player] = newPlayerHand
			card.selected = false
			card.player = 'common'
			state.commonCards.push(card)
		},

		dealDid (state) {
			if (state.deal === 6) {
				state.status = 'finished'
			} else {
				state.deal++
			}
		},

		setResults (state, {player, dealer}) {
			const playerResults = state.results.player
			const dealerResults = state.results.dealer
			playerResults[playerResults.length - 1] = playerResults[playerResults.length - 1] + player
			dealerResults[dealerResults.length - 1] = dealerResults[dealerResults.length - 1] + dealer
		}
	},
	actions: {
		resetGame ({commit, dispatch}, points) {
			commit('clearStateToNewGame', points)
			commit('cardsToDeck')
			setTimeout(() => {
				dispatch('startBroomGame')
			}, 1000)
		},
		startBroomGame ({commit, dispatch}) {
			let deck = prepareDeck()
			commit('setNewDeck', deck)
			dispatch('startDeal')
		},

		startDeal ({commit, dispatch, state}) {
			if (state.deal === 6) {
				state.status = 'finished'
				return
			}
			const dealQueue = ['player', 'dealer', 'player', 'dealer', 'player', 'dealer']
			dealQueue.forEach((hand, i) => {
				setTimeout(() => {
					commit('deal', hand)
				}, 10 * i)
			})
			if (state.deal === 0) {
				setTimeout(() => {
					dispatch('startDealCommonCards')
				}, 10 * dealQueue.length - 1)
			}
			commit('dealDid')
		},

		startDealCommonCards ({commit, state}) {
			const commonCards = 4
			for (let i = 0; i < commonCards; i++) {
				setTimeout(() => {
					commit('deal', 'commonCard')
					if (i === commonCards - 1) {
						const turn = state.round % 2 ? 'player' : 'dealer'
						commit('setTurn', turn)
					}
				}, 10 * i)
			}
		},

		correctPlay ({commit, state}) {
			const hands = {
				player: state.playerCards,
				dealer: state.dealerCards
			}
			const turn = state.turn
			state.selectedCards.forEach((selectedCard, index) => {
				for (let i = 0; i < hands[turn].length; i++) {
					const playerCard = hands[turn][i]
					if (playerCard.suit === selectedCard.suit && playerCard.value === selectedCard.value) {
						commit('removePlayedCard', playerCard)
						break
					}
				}
				for (let i = 0; i < state.commonCards.length; i++) {
					const commonCard = state.commonCards[i]
					if (commonCard.suit === selectedCard.suit && commonCard.value === selectedCard.value) {
						commit('removePlayedCard', commonCard)
					}
				}
			})
			commit('resetSelectedCards')
			commit('changeTurn')
		},

		pass ({commit, state}, {player, card}) {
			commit('setCardToCommonCards', {player, card})
			commit('resetSelectedCards')
			commit('changeTurn')
		},

		dealerPass ({commit, state}, {player, card}) {
			commit('setCardToCommonCards', {player, card})
			commit('resetSelectedCards')
			commit('changeTurn')
		},

		dealerPlay ({commit}, cards) {
			commit('dealerSelectedCards', cards)
			return true
		},

		showResults ({commit, state}) {
			const points = {
				player: 0,
				dealer: 0
			}
			const countCards = (cards) => {
				return {
					cards: cards.length,
					goldSeven: cards.filter(card => card.value === 7 && card.suit === 'gold').length,
					seven: cards.filter(card => card.value === 7).length,
					gold: cards.filter(card => card.suit === 'gold').length
				}
			}
			const cardsOnPlayerDeck = state.deck.filter(card => card.position === 'playerDeck')
			const cardsOnDealerDeck = state.deck.filter(card => card.position === 'dealerDeck')
			const playerResults = countCards(cardsOnPlayerDeck)
			const dealerResults = countCards(cardsOnDealerDeck)
			Object.keys(playerResults).forEach(key => {
				if (playerResults[key] > dealerResults[key]) {
					points.player++
				} else if (playerResults[key] < dealerResults[key]) {
					points.dealer++
				}
			})
			commit('setResults', points)
		},
		newRound ({commit, dispatch}) {
			commit('clearStateToNextRound')
			commit('cardsToDeck')
			setTimeout(() => {
				dispatch('startBroomGame')
			}, 1000)
		}
	},

	getters: {
		commonCards: state => state.deck.filter(card => card.position === 'common'),
		dealerCards: state => state.deck.filter(card => card.position === 'dealer'),
		dealerWinnedrCards: state => state.deck.filter(card => card.position === 'dealerDeck'),
		playerCards: state => state.deck.filter(card => card.position === 'player'),
		playerWinnedCards: state => state.deck.filter(card => card.position === 'playerDeck')
	}
})
