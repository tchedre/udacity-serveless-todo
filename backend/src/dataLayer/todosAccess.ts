import * as AWS from 'aws-sdk';
//import * as AWSXRay from 'aws-xray-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { TodoItem } from "../models/TodoItem";
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class TodosAccess {
  constructor(
      private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
      private readonly todosTable = process.env.TODO_TABLE,
      private readonly indexName = process.env.INDEX_NAME
  ) {}

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
      await this.docClient.put({
          TableName: this.todosTable,
          Item: todoItem
      }).promise();
      return todoItem;
  }

  async getAllTodos(userId: string): Promise<TodoItem[]> {
      const result = await this.docClient.query({
          TableName: this.todosTable,
          IndexName: this.indexName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
              ':userId': userId
          }
      }).promise();

      return result.Items as TodoItem[];
  }

  async getTodo(id: string): Promise<TodoItem>{
    const result = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues:{
            ':todoId': id
        }
    }).promise()

    const item = result.Items[0];
    return item as TodoItem;
}

async deleteTodo(todoId: string, userId: string): Promise<void> {
    this.docClient
        .delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
        })
        .promise();
}

async updateTodo(todoId:string, userId: string, updatedTodo:UpdateTodoRequest){
    await this.docClient.update({
        TableName: this.todosTable,
        Key:{
            'todoId':todoId,
            'userId':userId
        },
        UpdateExpression: 'set #namefield = :n, dueDate = :d, done = :done',
        ExpressionAttributeValues: {
            ':n' : updatedTodo.name,
            ':d' : updatedTodo.dueDate,
            ':done' : updatedTodo.done
        },
        ExpressionAttributeNames:{
            "#namefield": "name"
          }
      }).promise()
}

public async setAttachmentUrl(
    todoId: string,
    userId: string,
    attachmentUrl: string,
): Promise<void> {
    this.docClient
        .update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl,
            },
            ReturnValues: 'UPDATED_NEW',
        })
        .promise();
}

}