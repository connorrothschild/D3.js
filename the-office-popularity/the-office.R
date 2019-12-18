## ------------------------------------------------------------------------
library(schrute)
library(tidyverse)

## ------------------------------------------------------------------------
transcripts <- schrute::theoffice

## ------------------------------------------------------------------------
transcripts_tokenized <- transcripts %>%
  tidytext::unnest_tokens(word, text)

## ------------------------------------------------------------------------
keep_characters <- transcripts %>% 
  group_by(character) %>% 
  count() %>% 
  arrange(desc(n)) %>% 
  head(9) %>% 
  pull(character)

## ------------------------------------------------------------------------
data_chord <- transcripts_tokenized %>% 
  filter(character %in% keep_characters) %>% 
  mutate(jim = ifelse(word == "jim", 1, 0)) %>% 
  mutate(michael = ifelse(word == "michael", 1, 0)) %>% 
  mutate(dwight = ifelse(word == "dwight", 1, 0)) %>% 
  mutate(pam = ifelse(word == "pam", 1, 0)) %>% 
  mutate(andy = ifelse(word == "andy", 1, 0)) %>% 
  mutate(angela = ifelse(word == "angela", 1, 0)) %>% 
  mutate(kevin = ifelse(word == "kevin", 1, 0)) %>% 
  mutate(erin = ifelse(word == "erin", 1, 0)) %>% 
  mutate(oscar = ifelse(word == "oscar", 1, 0)) %>% 
  # mutate(ryan = ifelse(word == "ryan", 1, 0)) %>% 
  # mutate(darryl = ifelse(word == "darryl", 1, 0)) %>% 
  # mutate(phyllis = ifelse(word == "phyllis", 1, 0)) %>% 
  # mutate(kelly = ifelse(word == "kelly", 1, 0)) %>% 
  # mutate(toby = ifelse(word == "toby", 1, 0)) %>% 
  group_by(character) %>% 
  summarise_at(vars(jim:oscar), funs(sum))


## ------------------------------------------------------------------------
circlize_data <- as.data.frame(data_chord) %>% 
  pivot_longer(jim:oscar, names_to = "to", values_to = "value") %>% 
  rename(from = 'character') %>% 
  mutate(to = str_to_title(to))

## ------------------------------------------------------------------------
int_chord <- as.data.frame(data_chord)

rownames(int_chord) <- int_chord$character

row.order <- c("Jim", "Michael", "Dwight", "Pam", "Andy", "Angela", "Kevin", "Erin", "Oscar")
               #, "Ryan", "Darryl", "Phyllis", "Kelly", "Toby")
int_chord <- int_chord[row.order,]


## ------------------------------------------------------------------------
# devtools::install_github("mattflor/chorddiag")
library(chorddiag)

m <- as.matrix(int_chord[-1])

dimnames(m) <- list(have = int_chord$character,
                    prefer = str_to_title(colnames(int_chord[-1])))

d3data <- as.data.frame(m)
# order: Jim Michael Dwight Pam Andy Angela Kevin Erin Oscar
rownames(d3data) <- NULL
colnames(d3data) <- NULL

write.csv(d3data, "data.csv")

## ------------------------------------------------------------------------
groupColors <- c("#B997C7", "#824D99", "#4E78C4", "#57A2AC", "#7EB875", "#D0B541", "#E67F33", "#CE2220", "#521A13")