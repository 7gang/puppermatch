# puppermatch

### DEV SETUP
1. Clone the repo with `git clone https://github.com/7gang/puppermatch/`, followed by `cd puppermatch`.
2. Install NPM dependencies with `npm i`.
3. Run the application in "developer mode" with `npm run watch`.
4. Go to `http://localhost:3000/` in your browser of choice.

### DESCRIPTION
Currently, the basic web app contains a "main" view given by `index.html` under the `/public` directory. Notice how this directory also contains compartments for javascript and css.

If you go to `http://localhost:3000/users` you enter another part of the website. This is currently and API endpoint, defined in `/routes/users.js`. All of this is sown together in the `app.js` script in the top-level.
