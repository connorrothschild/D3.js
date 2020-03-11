library(tidyverse)

data <- readr::read_csv("../../data/cleaned_data.csv")

cities <- data %>% 
  distinct(City, State, CityState)

write.csv(cities, "../../data/city_data.csv")
