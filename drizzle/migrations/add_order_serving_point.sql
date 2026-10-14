-- Add selling-point attribution to POS orders.
ALTER TABLE `orders`
  ADD COLUMN `servingPointId` int DEFAULT NULL;

ALTER TABLE `orders`
  ADD KEY `orders_servingPointId_serving_points_id_fk` (`servingPointId`);

ALTER TABLE `orders`
  ADD CONSTRAINT `orders_servingPointId_serving_points_id_fk`
    FOREIGN KEY (`servingPointId`) REFERENCES `serving_points` (`id`)
    ON DELETE NO ACTION ON UPDATE NO ACTION;
