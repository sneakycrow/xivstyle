import { SCOPES, BASE_URL, CLIENT_ID, REDIRECT_URI } from '../configs/discordVariables';
import useUser from '../lib/useUser';
import { useRouter } from 'next/router';
import fetchJson from '../lib/fetchJson';

const Profile = () => {
  const authorizedURL = `${BASE_URL}/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=${SCOPES.join(' ')}`;

  const { user, mutateUser } = useUser();
  const router = useRouter();

  return user && !user.isLoggedIn ? (
    <a href={authorizedURL}>Login with Discord</a>
  ) : (
    <p>
      {user.username}{' '}
      <a
        href="/api/logout"
        onClick={async (event) => {
          event.preventDefault();
          await mutateUser(fetchJson('/api/logout'));
          router.reload();
        }}
      >
        Logout
      </a>
    </p>
  );
};

export default Profile;
