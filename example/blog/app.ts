import bodyParser from 'body-parser';
import errorhandler from 'errorhandler';
import express from 'express';
import { mongoosastic } from 'mongoosastic-ts';
import { MongoosasticModel } from 'mongoosastic-ts/dist/types';
import mongoose, { Schema, model } from 'mongoose';

const app = express();

// Configuration
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.use(errorhandler());

// Model
mongoose.connect('mongodb://0.0.0.0:27017/silly-blog', function (err) {
  if (err) {
    console.error(err);
  }
  console.log('connected.... unless you see an error the line before this!');
});

const BlogPostSchema = new Schema({
  title: { type: String },
  content: { type: String },
});

BlogPostSchema.plugin(mongoosastic);

const BlogPost = model<typeof BlogPostSchema, MongoosasticModel<typeof BlogPostSchema>>('BlogPost', BlogPostSchema);

BlogPost.createMapping()
  .then((mapping) => {
    console.log('mapping created!');
    console.log({ mapping });
  })
  .catch((err) => {
    console.log('error creating mapping (you can safely ignore this)');
    console.log({ err });
  });

// Routes

app.get('/', function (req, res) {
  res.render('index', { title: 'Mongoosastic Example' });
});

app.get('/search', async function (req, res) {
  const results = await BlogPost.search({ query_string: { query: req.query.q } });
  res.send(results);
});

app.get('/post', function (req, res) {
  res.render('post', { title: 'New Post' });
});

app.post('/post', async function (req, res) {
  const post = await BlogPost.create(req.body);
  post.on('es-indexed', function () {
    console.log('document indexed');
  });
  res.redirect('/');
});

app.listen(3000, function () {
  console.log('Express server listening on port %d in %s mode', 3000, app.settings.env);
});
