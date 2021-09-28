import { createIntents, createMatchers, createUserScenario, SaluteHandler, SaluteRequest } from '@salutejs/scenario';
import MovieDB from 'node-themoviedb';
import model from './intents.json'
import { recommendTVShow } from './movieApi';
import { appendMovieCard } from './utils/utils';
require('dotenv').config()
export const intents = createIntents(model.intents)
const { action, regexp, intent, text } = createMatchers<SaluteRequest , typeof intents>();

export const newTVShowHandler: SaluteHandler = async ({req, res, session}) => {
  const recommendations = await recommendTVShow(req.message.original_text)
  if (recommendations?.results?.length){
    session.recommendations = recommendations
    session.currentItem = 1
    session.userTVShow = req.message.original_text
    res.appendCard(appendMovieCard(recommendations.results[0]))
    res.appendSuggestions(['Найти другой сериал', 'Ещё'])
    if (req.request.payload.character.appeal === 'official') {
      res.setPronounceText(`Рекомендую ${recommendations.results[0].name}. ${recommendations.results[0].overview}. Скажите \"ещё\", чтобы посмотреть другую рекомендацию.`)
    } else {
      res.setPronounceText(`Рекомендую ${recommendations.results[0].name}. ${recommendations.results[0].overview}. Скажи \"ещё\", чтобы посмотреть другую рекомендацию.`)
    }
  } else {
    res.setPronounceText('К сожалению, я не знаю таких сериалов.')
    res.appendBubble('К сожалению, я не знаю таких сериалов.')
    res.appendSuggestions(['Найти другой сериал'])
  }
}

export const goToNewTVShowHandler: SaluteHandler = ({req, res}, dispatch) => {
  if (req.request.payload.character.appeal === 'official'){
    res.setPronounceText('Какой сериал вам нравится?')
    res.appendBubble('Какой сериал вам нравится?')
  } else {
    res.setPronounceText('Какой сериал тебе нравится?')
    res.appendBubble('Какой сериал тебе нравится?')
  }
  dispatch && dispatch(['searchTVShow'])
}

export const userScenario = createUserScenario({
  searchTVShow: {
    match: () => false,
    handle: ({res}) => {
      res.setAutoListening(true)
    },
    children: {
      TVShowName: {
        match: (req) => !!req.message.original_text,
        handle: newTVShowHandler
      }
    }
  },
  newTVShow: {
    match: intent('/Найти сериал', {confidence: 0.2}),
    handle: goToNewTVShowHandler
  },
  howManyRecommendations: {
    match: intent('/Сколько рекомендаций', {confidence: 0.2}),
    handle: ({res, session}) => {
      const { recommendations, userTVShow } = session as { recommendations: MovieDB.Responses.TV.GetRecommendations, userTVShow: string }
      res.setPronounceText(`Всего ${recommendations.total_results} рекомендаций.`)
    }
  },
  nextRecommendation: {
    match: intent('/Следующий совет', { confidence: 0.2 }),
    handle: ({ req, res, session }) => {
      const { recommendations, currentItem } = session as { recommendations: MovieDB.Responses.TV.GetRecommendations, currentItem: number }
      console.log('currentItem', currentItem)
      const currentTVShow = recommendations.results[currentItem]

      if (recommendations.total_results > currentItem) {
        if (req.request.payload.character.appeal === 'official') {
          res.setPronounceText(`Рекомендую ${currentTVShow.name}. ${currentTVShow.overview}. Скажите \"ещё\", чтобы посмотреть другую рекомендацию.`)
        } else {
          res.setPronounceText(`Рекомендую ${currentTVShow.name}. ${currentTVShow.overview}. Скажи \"ещё\", чтобы посмотреть другую рекомендацию.`)
        }
        session.currentItem = currentItem + 1
        res.appendCard(appendMovieCard(currentTVShow))
        res.appendSuggestions(['Найти другой сериал', 'Ещё'])
      } else {
        res.setPronounceText('У меня больше нет рекомендаций. Может попробуем другой сериал?')
        res.appendBubble('У меня больше нет рекомендаций. Может попробуем другой сериал?')
        res.appendSuggestions(['Найти другой сериал'])
      }
      res.setAutoListening(true)
    },
    children: {
      yes: {
        match: intent('/Да', { confidence: 0.2 }),
        handle: goToNewTVShowHandler
      },
      no: {
        match: intent('/Нет', { confidence: 0.2 }),
        handle: ({res}) => {
          res.setPronounceText('Тогда до новых встреч.')
          res.appendBubble('Тогда до новых встреч.')
          res.finish()
        }
      }
    }
  }
})