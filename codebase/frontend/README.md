
  # Meditation app design

  This is a code bundle for Meditation app design. The original project is available at https://www.figma.com/design/GrzWxfVpPFy8WRcIisfWhJ/Meditation-app-design.

  ## Agent setup

  The chatbot is now wired as a live agent layer instead of a static mock.

  Create a local `.env` file from [.env.example](./.env.example) and provide:

  - `VITE_WEATHER_API_KEY`
  - `VITE_TRAVEL_TIME_API_URL`
  - `VITE_TRAVEL_TIME_API_KEY`
  - `VITE_OVERPASS_API_URL` if you want to override the default Overpass endpoint

  The agent will still run with fallbacks if the travel-time API is not configured yet, but weather enrichment needs a valid weather key.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
