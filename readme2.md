# Change this:

# DATABASE_URL: postgres://postgres:secret@db:5432/mood_board

# To this (wrong):

# DATABASE_URL: postgres://postgres:secret@localhost:5432/mood_board

#What happens: ECONNREFUSED — Next.js can't connect to Postgres at all.
#Why: Inside Docker Compose, localhost means inside the container itself — not the db service. Service names are the correct hostnames.
#Fix: Change back to db:5432.
