Make sure containers are running
docker compose up -d
docker ps

2. Inspect the networks
   docke network ls
   See which containers are on it and what IP do they have
   docker network inspect mood-board_default

3. Get the IP for each container
   docker inspect mood-board-db-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' -> 172.18.0.2
   docker inspect mood-board-next-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' -> 172.18.0.4
   docker inspect mood-board-server-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' -> 172.18.0.3

4. Ping between containers by service name
   docker exec -it mood-board-next-1 sh

   ping db -c 4

   ping server -c 4

5. Ping by IP instead of name
   DB_IP=$(docker inspect mood-board-db-1 --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')

   docker exec -it mood-board-next-1 ping 172.18.0.2 -c 4

   exit

6. Check what Postgres is listening on
   docker exec -it mood-board-db-1 sh -c "cat /proc/net/tcp6" or docker port mood-board-db-1
