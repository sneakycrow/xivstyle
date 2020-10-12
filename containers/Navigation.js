import Profile from '../components/Profile';

const Navigation = () => {
  return (
    <nav>
      <a href="/">Branding</a>
      <ul>
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/another">Another</a>
        </li>
        <li>
          <Profile />
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
