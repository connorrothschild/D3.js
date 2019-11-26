library(spotifyr)
library(tidyverse)

Sys.setenv(SPOTIFY_CLIENT_ID = 'x')
Sys.setenv(SPOTIFY_CLIENT_SECRET = 'x')

access_token <- get_spotify_access_token()

kanye <- get_artist_audio_features('kanye west')

grouped <- kanye %>% 
  group_by(album_name) %>% 
  summarise_at(vars(danceability:tempo), mean) 

grouped <- grouped %>% 
  filter(album_name != "Graduation (Alternative Business Partners)" & album_name != "Late Orchestration") %>% 
  mutate(album_name = ifelse(album_name == "Kanye West Presents Good Music Cruel Summer", "Good Music Cruel Summer", album_name))

write.csv(grouped, "./kanye_data.csv")

long_kanye_data <- tidyr::pivot_longer(grouped, danceability:tempo, "group") %>% 
  rename(score = "value")

write.csv(long_kanye_data, "./long_kanye_data.csv")

