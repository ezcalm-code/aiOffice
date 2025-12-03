package model

import (
	"context"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func entityList(ctx context.Context, col *mongo.Collection, query interface{}, v any, opt ...*options.FindOptions) error {
	cur, err := col.Find(ctx, query, opt...)
	if err != nil {
		return err
	}

	return cur.All(ctx, v)
}

func entityUpdateOrInsert(ctx context.Context, col *mongo.Collection, filter interface{}, update interface{}) error {
	_, err := col.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	return err
}
