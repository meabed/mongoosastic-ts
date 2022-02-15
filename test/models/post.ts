import { mongoosastic } from '../../lib/mongoosastic';
import { MongoosasticDocument, MongoosasticModel } from '../../lib/types';
import { Document, Schema, model } from 'mongoose';

export interface IUserModel extends Document, MongoosasticDocument {
  name?: string;
}

const UserSchema = new Schema<IUserModel>({
  name: { type: String },
});

export interface IPostCommentModel extends Document, MongoosasticDocument {
  text?: string;
  author?: Schema.Types.ObjectId;
}

const PostCommentSchema = new Schema<IPostCommentModel>({
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  text: { type: String },
});

export interface IPostModel extends Document, MongoosasticDocument {
  body?: string;
  author?: Schema.Types.ObjectId;
  comments?: Schema.Types.ObjectId[];
}

const PostSchema = new Schema<IPostModel>({
  body: { type: String, es_indexed: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', es_schema: UserSchema, es_indexed: true },
  comments: [{ type: Schema.Types.ObjectId, ref: 'PostComment', es_schema: PostCommentSchema, es_indexed: true }],
});

PostSchema.plugin(mongoosastic, {
  populate: [{ path: 'author' }, { path: 'comments', select: 'text' }],
});

export const userModel = model<IUserModel, MongoosasticModel<IUserModel>>('User', UserSchema);

export const postModel = model<IPostModel, MongoosasticModel<IPostModel>>('Post', PostSchema);

export const postCommentModel = model<IPostCommentModel, MongoosasticModel<IPostCommentModel>>(
  'PostComment',
  PostCommentSchema
);
