import { Generator } from '../lib/mapping-generator';
import { bowlingBallModel, personModel, PersonSchema } from './models/person';
import { serialize } from '../lib/serialize';

const mapping = Generator.generateMapping(PersonSchema);

describe('serialize', async function () {
  const dude = new personModel({
    name: {
      first: 'Jeffrey',
      last: 'Lebowski',
    },
    dob: new Date(Date.parse('05/17/1962')),
    bowlingBall: new bowlingBallModel(),
    games: [
      {
        score: 80,
        date: new Date(Date.parse('05/17/1962')),
      },
      {
        score: 80,
        date: new Date(Date.parse('06/17/1962')),
      },
    ],
    somethingToCast: 'Something',
  });

  // another person with missing parts to test robustness
  const millionaire = new personModel({
    name: {
      first: 'Jeffrey',
      last: 'Lebowski',
    },
  }).toObject();

  it('should serialize a document with missing bits', async function () {
    const serialized = serialize(millionaire, mapping);
    serialized.should.have.property('games', []);
  });

  describe('with no indexed fields', async function () {
    const serialized = serialize(dude, mapping);
    it('should serialize model fields', async function () {
      serialized.name.first.should.eql('Jeffrey');
      serialized.name.last.should.eql('Lebowski');
    });

    it('should serialize object ids as strings', async function () {
      serialized.bowlingBall.should.eql(dude.bowlingBall);
      serialized.bowlingBall.should.be.type('object');
    });

    it('should serialize dates in ISO 8601 format', async function () {
      serialized.dob.should.eql(dude.dob.toJSON());
    });

    it('should serialize nested arrays', async function () {
      serialized.games.should.have.lengthOf(2);
      serialized.games[0].should.have.property('score', 80);
    });

    it('should cast and serialize field', async function () {
      serialized.somethingToCast.should.eql('Something has been cast');
    });
  });
});
