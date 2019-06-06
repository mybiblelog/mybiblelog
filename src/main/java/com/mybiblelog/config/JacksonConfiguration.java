package com.mybiblelog.config;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * This class configures the Jackson ObjectMapper for the entire application.
 * Specifically, it ensures LocalDate values are serialized/deserialized correctly.
 */

@Configuration
public class JacksonConfiguration {

    public static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Bean
    public ObjectMapper objectMapper() {

		LocalDateDeserializer deserializer = new LocalDateDeserializer();
		LocalDateSerializer serializer = new LocalDateSerializer();
		
		JavaTimeModule javaTimeModule = new JavaTimeModule();
		javaTimeModule.addDeserializer(LocalDate.class, deserializer);
		javaTimeModule.addSerializer(LocalDate.class, serializer);	
		
		ObjectMapper mapper = new ObjectMapper();
		mapper.registerModule(javaTimeModule);
		
        return mapper;
    }
    
    public class LocalDateSerializer extends JsonSerializer<LocalDate> {
	    @Override
	    public void serialize(LocalDate value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
	        gen.writeString(value.format(FORMATTER));
	    }
	}
    
	public class LocalDateDeserializer extends JsonDeserializer<LocalDate> {
	    @Override
	    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
	        return LocalDate.parse(p.getValueAsString(), FORMATTER);
	    }
	}
}