library(dplyr)
library(imputeTS)
library(caret)
library(ROCR)
set.seed(123)

# Reading Heart data from csv
file_path <- "/Users/annie/Desktop/Graduate Course New/Capstone/heart.csv"
heart_failure_data <- read.csv(file_path)

# How many missing values
sum(is.na.data.frame(heart_failure_data))

# Various metrics such as mean, median, mode etc.
summary(heart_failure_data)

# Data is not imbalanced. Both the classes are present almost equally
table(heart_failure_data$HeartDisease)/length(heart_failure_data$HeartDisease) * 100

# Converting categorical variables into factors
heart_failure_data$HeartDisease <- as.factor(heart_failure_data$HeartDisease)
heart_failure_data$ChestPainType <- as.factor(heart_failure_data$ChestPainType)
heart_failure_data$RestingECG <- as.factor(heart_failure_data$RestingECG)
heart_failure_data$Sex <- as.factor(heart_failure_data$Sex)
heart_failure_data$ExerciseAngina <- as.factor(heart_failure_data$ExerciseAngina)
heart_failure_data$ST_Slope <- as.factor(heart_failure_data$ST_Slope)

# Partioning data into 80%-20%
intrain <- createDataPartition(heart_failure_data$HeartDisease, p=0.8,list =
                                 FALSE)
train1 <- heart_failure_data[intrain,]
test1 <- heart_failure_data[-intrain,]

#Cross Validation 
trctrl <- trainControl(method = "cv", number = 10)
# RPART IS decision tree model
model1 <- train(HeartDisease ~ ., train1, method = "rpart", trControl = trctrl)
pred <- predict(model1, newdata = test1)
confusionMatrix(pred, test1$HeartDisease)$overall[1]
ROCRpred <- prediction(as.numeric(pred), as.numeric(test1$HeartDisease))
#ROC Curve
ROCRperf <- performance(ROCRpred, 'tpr','fpr')
plot(ROCRperf,colorize = TRUE)
abline(0, 1)

imp1 <- varImp(model1, scale=TRUE)
plot(imp1)

####### model 2 SVM with linear kernel
model2 <- train(HeartDisease ~., train1, method = "svmLinear", trControl = trctrl)
pred <- predict(model2, newdata = test1)
confusionMatrix(pred, test1$HeartDisease)$overall[1]
ROCRpred <- prediction(as.numeric(pred), as.numeric(test1$HeartDisease))
#ROC Curve
ROCRperf <- performance(ROCRpred, 'tpr','fpr')
plot(ROCRperf,colorize = TRUE)
abline(0, 1)
imp1 <- varImp(model2, scale=TRUE)
plot(imp1)

####### model 2 SVM with linear kernel
model2 <- train(HeartDisease ~., train1, method = "svmPoly", trControl = trctrl)
pred <- predict(model2, newdata = test1)
confusionMatrix(pred, test1$HeartDisease)$overall[1]
ROCRpred <- prediction(as.numeric(pred), as.numeric(test1$HeartDisease))
#ROC Curve
ROCRperf <- performance(ROCRpred, 'tpr','fpr')
plot(ROCRperf,colorize = TRUE)
abline(0, 1)
imp1 <- varImp(model2, scale=TRUE)
plot(imp1)

####### model 2 SVM with radial kernel
model2 <- train(HeartDisease ~., train1, method = "svmRadial", trControl = trctrl)
pred <- predict(model2, newdata = test1)
confusionMatrix(pred, test1$HeartDisease)$overall[1]
ROCRpred <- prediction(as.numeric(pred), as.numeric(test1$HeartDisease))
#ROC Curve
ROCRperf <- performance(ROCRpred, 'tpr','fpr')
plot(ROCRperf,colorize = TRUE)
abline(0, 1)
imp1 <- varImp(model2, scale=TRUE)
plot(imp1)

#root_dir <- "/Users/annie/Desktop/Midterm Project/studentdropoutpredictionchallenge/"
#pred <- predict(model2, newdata = std.test)
# converting pred to numeric from factor and subtracting 1 since 0 factor is being converted as numeric value 1 and factor with value 1 is being converted as numeric 2.
#output = as.data.frame(cbind(StudentID = std.test$StudentID, Dropout = as.numeric(pred) - 1))
#write.csv(output, file =paste(root_dir, "output_svmLinear.csv", sep=""))
## Model 3 kNN
model3 <- train(HeartDisease ~ .-time, train1, method = "knn", trControl = trctrl)
pred <- predict(model3, newdata = test1)
confusionMatrix(pred, test1$HeartDisease)$overall[1]
imp1 <- varImp(model3)


####### model 5 bagged decision tree model
model5 <- train(HeartDisease ~ ., train1, method = "treebag",
                trControl=trctrl)
pred <- predict(model5, newdata = test1)
confusionMatrix(pred, test1$HeartDisease)$overall[1]
ROCRpred <- prediction(as.numeric(pred), as.numeric(test1$HeartDisease))
#ROC Curve
ROCRperf <- performance(ROCRpred, 'tpr','fpr')
plot(ROCRperf,colorize = TRUE)
abline(0, 1)
imp1 <- varImp(model5, scale=TRUE)
plot(imp1)

####### model 6 Random Forest
model6 <- train(HeartDisease ~ ., train1, method = "rf",
                trControl=trctrl)
pred <- predict(model6, newdata = test1)
confusionMatrix(pred, test1$HeartDisease)$overall[1]

ROCRpred <- prediction(as.numeric(pred), as.numeric(test1$HeartDisease))
#ROC Curve
ROCRperf <- performance(ROCRpred, 'tpr','fpr')
plot(ROCRperf,colorize = TRUE)
abline(0, 1)
imp1 <- varImp(model6, scale=TRUE)
plot(imp1)

