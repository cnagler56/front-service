import React from "react";

const capitalizeFirstLetter = (string: String) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

interface tokenObject {
  firstName: String;
  lastName: String;
}

const Header = () => {
  const tokenObject = {
    firstName: "Chris",
    lastName: "Nagel",
  };

  let welcomeMessage;

  if (tokenObject) {
    const capitalizedFirstName = capitalizeFirstLetter(tokenObject.firstName);
    const capitalizedLastName = capitalizeFirstLetter(tokenObject.lastName);
    welcomeMessage = `Welcome, ${capitalizedFirstName} ${capitalizedLastName}`;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400&display=swap');

        .farm-header {
          width: 100%;
          background: linear-gradient(135deg, #2c4a1e 0%, #3d6b2a 50%, #2c4a1e 100%);
          border-bottom: 3px solid #8fbc45;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 80px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.35);
          position: relative;
          overflow: hidden;
        }

        .farm-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }

        .farm-site-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.65rem;
          font-weight: 700;
          color: #f0f7e6;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          text-shadow: 0 2px 8px rgba(0,0,0,0.4);
          position: relative;
          z-index: 1;
        }

        .farm-site-title .leaf-icon {
          color: #8fbc45;
          font-size: 1.3rem;
          line-height: 1;
        }

        .farm-divider {
          width: 1px;
          height: 28px;
          background: linear-gradient(to bottom, transparent, #8fbc4566, transparent);
          margin: 0 0.75rem;
        }

        .farm-welcome {
          font-family: 'Lato', sans-serif;
          font-weight: 300;
          font-size: 0.875rem;
          color: #c8e6a0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .farm-welcome::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #8fbc45;
          border-radius: 50%;
          box-shadow: 0 0 6px #8fbc45;
        }
      `}</style>

      <header className="farm-header">
        <h1 className="farm-site-title">
          <span className="leaf-icon">🌿</span>
          Just4Ag
        </h1>
        <div className="farm-welcome">{welcomeMessage}</div>
      </header>
    </>
  );
};

export default Header;
