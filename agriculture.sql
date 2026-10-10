

USE agriculture;

CREATE TABLE crops(

id INT AUTO_INCREMENT PRIMARY KEY,

crop_name VARCHAR(100),

soil_type VARCHAR(100),

temperature INT,

rainfall INT

);

INSERT INTO crops(crop_name,soil_type,temperature,rainfall)

VALUES

('Rice','Clay',30,200),

('Wheat','Loamy',20,100),

('Cotton','Black',35,80),

('Maize','Sandy',28,120),

('Sugarcane','Clay',32,180);