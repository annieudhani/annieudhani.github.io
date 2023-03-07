create schema project;

use project;

create table users
(
	id int,
    email varchar(255),
    contact_number numeric(10),
    PRIMARY KEY (ID)
);

create table attribute
(
	id int,
    attribute_name int,
    units varchar(100),
    PRIMARY KEY (ID)
);

create table user_preferences
(
	user_id int,
    attribute_id int,
    units varchar(15),
    PRIMARY KEY (user_id, attribute_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (attribute_id) REFERENCES attribute(id)
);


create table city
(
	id int,
    city_name varchar(100),
    latitude numeric(2,2),
    longitude numeric(2,2),
    country_name varchar(100),
    PRIMARY KEY (id)
);

create table users_city
(
	users_id int,
    city_id int,
    PRIMARY KEY (users_id, city_id),
    FOREIGN KEY (users_id) REFERENCES users(id),
    FOREIGN KEY (city_id) REFERENCES city(id)
);


create table weather_status
(
	id int,
    status varchar(100),
    PRIMARY KEY (id)
);

create table weather_hourly_forecast
(
	id int,
    city_id int,
    start_time timestamp,
    end_time timestamp,
    weather_status_id int,
    temperature numeric(3,1),
    feels_like_temperature numeric(3,1),
    humidity numeric(3),
    wind_speed numeric(2,2),
    wind_direction varchar(2),
    pressure numeric(2,2),
    visibility numeric(2,2),
    PRIMARY KEY (id),
	FOREIGN KEY (city_id) REFERENCES city(id),
	FOREIGN KEY (weather_status_id) REFERENCES weather_status(id)
);

create table weather_daily_forecast
(
    city_id int,
    calendar_date date,
    weather_status_id int,
    min_temperature numeric(3,1),
    max_temparature numeric(3,1),
    avg_humidity numeric(3),
    sunrise_time timestamp,
    sunset_time timestamp,
    PRIMARY KEY (city_id, calendar_date),
	FOREIGN KEY (city_id) REFERENCES city(id),
	FOREIGN KEY (weather_status_id) REFERENCES weather_status(id)
);
