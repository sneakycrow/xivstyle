import axios from 'axios';
import gql from 'graphql-tag';
import { print } from 'graphql';
import qs from 'qs';
import {
  SCOPES,
  BASE_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
} from '../../configs/discordVariables';
import withSession from '../../lib/session';

const handleRegister = async (req, res) => {
  const code = req.query.code;

  const token = await getTokenFromDiscord(code);
  const discordUser = await getUserFromDiscord(token.access_token);

  let userDataInDB = await getUserFromDB(discordUser.email);
  let message = 'old user';

  if (!userDataInDB) {
    userDataInDB = await saveUserToDB(discordUser);
    message = 'new user';
  }

  req.session.set('user', userDataInDB);
  await req.session.save();
  res.send(`Logged In: ${message}`);
};

const getTokenFromDiscord = async (code) => {
  const tokenRequestData = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
  };
  const tokenResponseData = await axios({
    method: 'POST',
    url: `${BASE_URL}/oauth2/token`,
    data: qs.stringify(tokenRequestData),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((res) => res.data);

  return tokenResponseData;
};

const getUserFromDiscord = async (token) => {
  const userData = await axios({
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    url: `${BASE_URL}/users/@me`,
  }).then((res) => res.data);
  return userData;
};

const saveUserToDB = async (user) => {
  const INSERT_USER_MUTATION = gql`
    mutation MyMutation($email: String = "", $username: String = "") {
      insert_users(objects: { email: $email, username: $username }) {
        returning {
          id
          email
          username
        }
      }
    }
  `;
  const userData = await axios({
    method: 'POST',
    headers: {
      'x-hasura-admin-secret': process.env.GRAPHQL_SECRET,
      'Content-Type': 'application/json',
    },
    url: process.env.GRAPHQL_API,
    data: {
      query: print(INSERT_USER_MUTATION),
      variables: {
        email: user.email,
        username: user.username,
      },
    },
  }).then((res) => {
    if (res.data.errors) {
      const errorMessage = res.errors[0].message;
      if (
        errorMessage ===
        'Uniqueness violation. duplicate key value violates unique constraint "users_email_key"'
      ) {
        return {
          error: 'EMAIL_EXISTS',
        };
      }
    }

    return res.data?.data?.insert_users?.returning[0];
  });

  return userData;
};

const getUserFromDB = async (email) => {
  const GET_USER_QUERY = gql`
    query MyQuery($email: String = "") {
      users(where: { email: { _eq: $email } }) {
        email
        id
        username
      }
    }
  `;
  const userData = await axios({
    method: 'POST',
    headers: {
      'x-hasura-admin-secret': process.env.GRAPHQL_SECRET,
      'Content-Type': 'application/json',
    },
    url: process.env.GRAPHQL_API,
    data: {
      query: print(GET_USER_QUERY),
      variables: {
        email,
      },
    },
  }).then((res) => {
    const user = res.data?.data?.users[0] ?? null;
    return user;
  });

  return userData;
};

export default withSession(handleRegister);
