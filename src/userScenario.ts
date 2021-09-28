import { createIntents, createMatchers, createUserScenario, SaluteHandler, SaluteRequest } from '@salutejs/scenario';
import MovieDB from 'node-themoviedb';
import model from './intents.json'
import { recommendTVShows, getGenres, findTVShow } from './movieApi';
import { createMovieCard, sendNewTVShow } from './utils/utils';
require('dotenv').config()
export const intents = createIntents(model.intents)
const { action, regexp, intent, text } = createMatchers<SaluteRequest , typeof intents>();

export const newTVShowHandler: SaluteHandler = async ({req, res, session}) => {
  const foundTVShow = await findTVShow(req.message.original_text)
  if (!foundTVShow || foundTVShow.total_results === 0) {
    res.setPronounceText('К сожалению, я не знаю таких сериалов.')
    res.appendBubble('К сожалению, я не знаю таких сериалов.')
    res.appendSuggestions(['Найти другой сериал'])
  } else {
    const recommendations = await recommendTVShows(foundTVShow?.results[0].id)
    const genres = await getGenres()
    if (recommendations && recommendations?.results?.length > 0) {
      session.genres = genres
      session.recommendations = recommendations
      session.currentItem = 1
      session.userTVShow = req.message.original_text
      res.setAutoListening(true)
      sendNewTVShow(
        req,
        res,
        recommendations.results[0],
        genres as MovieDB.Responses.Genre.Common,
        `Рекомендации для сериала ${foundTVShow.results[0].name}. `
      )
    } else {
      session.recommendations = null
      res.appendBubble('К сожалению, у меня нет рекомендаций для этого сериала.')
      res.setPronounceText('К сожалению, у меня нет рекомендаций для этого сериала.')
      res.appendSuggestions(['Найти другой сериал'])
    }
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

export const howManyRecommendationsHandler: SaluteHandler = ({res, session}) => {
  const { recommendations, userTVShow } = session as { recommendations: MovieDB.Responses.TV.GetRecommendations, userTVShow: string }
  res.setPronounceText(`Всего ${recommendations.total_results} рекомендаций.`)
  res.appendSuggestions(['Найти другой сериал', 'Ещё'])
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
        handle: newTVShowHandler,
        children: {
          howManyRecommendations: {
            match: intent('/Сколько рекомендаций', {confidence: 0.2}),
            handle: howManyRecommendationsHandler
          }
        }
      }
    }
  },
  getGenres: {
    match: () => false,
    handle: async ({session}, dispatch) => {
      session.genres = await getGenres()
      dispatch && dispatch(['searchTVShow'])
    }
  },
  newTVShow: {
    match: intent('/Найти сериал', {confidence: 0.2}),
    handle: goToNewTVShowHandler
  },
  nextRecommendation: {
    match: intent('/Следующий совет', { confidence: 0.2 }),
    handle: ({ req, res, session }) => {
      const { recommendations, currentItem, genres } = session as {
        recommendations: MovieDB.Responses.TV.GetRecommendations | null,
        genres: MovieDB.Responses.Genre.Common,
        currentItem: number
      }
      console.log('currentItem', currentItem)

      if (recommendations && recommendations.total_results > currentItem) {
        const currentTVShow = recommendations.results[currentItem]
        sendNewTVShow(req, res, currentTVShow, genres)
        session.currentItem = currentItem + 1
      } else {
        res.setPronounceText('У меня больше нет рекомендаций. Может попробуем другой сериал?')
        res.appendBubble('У меня больше нет рекомендаций. Может попробуем другой сериал?')
        res.appendSuggestions(['Найти другой сериал'])
      }
      res.setAutoListening(true)
    },
    children: {
      howManyRecommendations: {
        match: intent('/Сколько рекомендаций', {confidence: 0.2}),
        handle: howManyRecommendationsHandler
      },
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