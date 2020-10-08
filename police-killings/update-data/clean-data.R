library(tidyverse)
library(RCurl)

url <- "https://mappingpoliceviolence.org/s/MPVDatasetDownload.xlsx"
download.file(url, destfile = here::here("data/uncleaned_data.xlsx"))

data <- readxl::read_excel(here::here("data/uncleaned_data.xlsx"))

data <- data %>% 
  rename("Date" = `Date of Incident (month/day/year)`,
         "Link" = `Link to news article or photo of official document`,
         "Armed Status" = `Unarmed/Did Not Have an Actual Weapon`, 
         "Age" = `Victim's age` , 
         "Race" = `Victim's race`, 
         "Sex" = `Victim's gender`, 
         "Image" = `URL of image of victim`, 
         "Name" = `Victim's name`) %>% 
  mutate(Zipcode = as.character(Zipcode),
         `Body Camera (Source: WaPo)` = as.logical(`Body Camera (Source: WaPo)`),
         `WaPo ID (If included in WaPo database)` = as.logical(`WaPo ID (If included in WaPo database)`)) %>% 
  arrange(Date)

clean_data <- data %>% 
  mutate(Year = lubridate::year(Date),
         `Armed Status` = ifelse(`Armed Status` == 'Unarmed/Did Not Have an Actual Weapon', 'Unarmed', `Armed Status`),
         # manually adding image of Shelly Porter III, per family request
         `Image` = ifelse(Name == "Shelly Porter III", "https://i.imgur.com/64RKdEw.jpg", Image),
         `Agency responsible for death` = ifelse(is.na(`Agency responsible for death`), 'Unknown', `Agency responsible for death`),
         `Agencies responsible for death` = `Agency responsible for death`,
         `Agency responsible for death` = str_replace_all(`Agency responsible for death`, 
                                                      ", ", 
                                                      replacement = paste0(" (", State, "), ")),
         `Agency responsible for death` = paste0(`Agency responsible for death`, " (", State, ")"),
         `Cause of death` = str_replace(`Cause of death`, ",.*",""),
         Race = str_to_title(Race),
         `Cause of death` = str_to_title(`Cause of death`),
         `Symptoms of mental illness?` = str_to_title(`Symptoms of mental illness?`),
         ID = row_number())


readr::write_csv(clean_data, here::here("data/cleaned_data.csv"))

source(here::here('update-data/pull-departments.R'))
