library(spotifyr)
library(tidyverse)

# input ids here
keys <- yaml::read_yaml("keys.yaml")
Sys.setenv(SPOTIFY_CLIENT_ID = keys$client_id)
Sys.setenv(SPOTIFY_CLIENT_SECRET = keys$client_secret)

access_token <- get_spotify_access_token()

kanye <- get_artist_audio_features('kanye west')
kanye

song_data <- kanye %>% 
  select(album_release_year, danceability:tempo, duration_ms, explicit, track_name, external_urls.spotify, album_name:key_mode)

song_data <- song_data %>% 
  mutate(album_name = ifelse(album_name == "Kanye West Presents Good Music Cruel Summer", "Good Music Cruel Summer", album_name),
         album_name = ifelse(album_name == "My Beautiful Dark Twisted Fantasy", "MBDTF", album_name),
         track_name = str_replace(track_name, "- Album Version *|\\(Interlude\\)|- Bonus Track|- Live At Abbey Road Studios", ""),
         track_name = gsub("(Edited)", "", track_name, fixed = TRUE),
         track_name = str_trim(track_name)) %>% 
  filter(track_name != str_detect(track_name, "Skit*"),
         album_name != "Graduation (Alternative Business Partners)") %>% 
  distinct(track_name, .keep_all = TRUE)

write.csv(song_data, "../data/song_data.csv")

grouped <- song_data %>% 
  group_by(album_name) %>% 
  summarise_at(vars(danceability:tempo), mean) 

grouped <- grouped %>% 
  filter(album_name != "Graduation (Alternative Business Partners)" & album_name != "Late Orchestration") %>% 
  mutate(album_name = ifelse(album_name == "Kanye West Presents Good Music Cruel Summer", "Good Music Cruel Summer", album_name))

write.csv(grouped, "../data/kanye_data.csv")

lyrics <- get_album_data("Kanye West", "JESUS IS KING")
