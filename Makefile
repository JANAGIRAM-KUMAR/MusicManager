.PHONY: dev build up down logs

dev:
	docker-compose up --build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

build:
	docker-compose build

clean:
	docker-compose down -v --rmi all
