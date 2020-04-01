## take all individual year datasets and merge them
## data from this portal https://ireports.wrapsnet.org/Interactive-Reporting/EnumType/Report?ItemPath=/rpt_WebArrivalsReports/MX%20-%20Arrivals%20by%20Destination%20and%20Nationality
filenames <- list.files(path="./data/",pattern="*.csv")
fullpath=file.path("./data/",filenames)

dataset <- do.call("cbind", lapply(fullpath,FUN=function(files){ read.csv(files, skip = 1, stringsAsFactors = FALSE)}))

library(tidyverse)

## remove all of the extraneous 'week' columns
dataset <- subset(dataset, select=which(!duplicated(names(dataset)))) 

dataset <- dataset %>% 
  janitor::clean_names()

# complete merged data
write.csv(dataset, "./data/final/data.csv")
