package com.openchart.directory;

public record Hospital(long id, String name, String address, String city, String state,
                       String zipcode, String websiteUrl, Double latitude, Double longitude) {}
